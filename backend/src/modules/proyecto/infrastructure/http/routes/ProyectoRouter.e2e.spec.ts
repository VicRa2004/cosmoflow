import { beforeAll, describe, expect, it, spyOn } from "bun:test";
import type { Correo } from "@/core/shared/domain/Mailer";
import { container } from "@/core/shared/infrastructure/di/container";
import { TOKENS } from "@/core/shared/infrastructure/di/tokens";
import { api, crearUsuario, login, vaciarUsuarios } from "@/test/e2e";

const correos: Correo[] = [];
spyOn(container.get(TOKENS.Mailer), "enviar").mockImplementation(
	async (correo) => {
		correos.push(correo);
	},
);

describe("Proyectos (e2e)", () => {
	const t: Record<string, string> = {};
	const id: Record<string, number> = {};
	let acme: number;
	let otra: number;
	let plataforma: number;
	let movil: number;
	let ajeno: number;
	const org = (o: number, ruta: string) => `/api/organizaciones/${o}${ruta}`;
	const post = async (ruta: string, token: string, body: unknown) =>
		api(ruta, { method: "POST", token, body });

	beforeAll(async () => {
		await vaciarUsuarios();
		for (const quien of ["ana", "beto", "caro", "zoe", "yan"]) {
			await crearUsuario(`${quien}@proyecto.dev`, "USUARIO");
			t[quien] = await login(`${quien}@proyecto.dev`);
		}
		const crearOrg = async (token: string) =>
			(
				await (
					await post("/api/organizaciones", token, {
						nombre: "Org",
						color: "#6366f1",
					})
				).json()
			).id as number;
		acme = await crearOrg(t.ana);
		otra = await crearOrg(t.zoe);
		const unir = async (o: number, admin: string, quien: string) => {
			await post(org(o, "/invitaciones"), t[admin], {
				email: `${quien}@proyecto.dev`,
			});
			await post("/api/invitaciones/aceptar", t[quien], {
				token: correos.at(-1)?.texto.match(/token=([a-f0-9]{64})/)?.[1],
			});
		};
		await unir(acme, "ana", "beto");
		await unir(acme, "ana", "caro");
		await unir(otra, "zoe", "yan");
		for (const o of [acme, otra]) {
			const admin = o === acme ? t.ana : t.zoe;
			const miembros = await (
				await api(org(o, "/miembros"), { token: admin })
			).json();
			for (const m of miembros as { email: string; usuarioId: number }[]) {
				id[m.email.split("@")[0]] = m.usuarioId;
			}
		}
		const equipo = async (o: number, token: string, miembroIds: number[]) =>
			(
				await (
					await post(org(o, "/equipos"), token, {
						nombre: "Equipo",
						color: "#6366f1",
						miembroIds,
					})
				).json()
			).id as number;
		plataforma = await equipo(acme, t.ana, [id.ana, id.beto]);
		movil = await equipo(acme, t.ana, [id.beto, id.caro]);
		ajeno = await equipo(otra, t.zoe, [id.zoe, id.yan]);
	});

	it("crear exige un equipo de la organización y proyectos:crear (RN-31)", async () => {
		const ruta = org(acme, "/proyectos");
		expect(
			(await post(ruta, t.ana, { nombre: "X", equipoIds: [] })).status,
		).toBe(400);
		expect(
			(await post(ruta, t.ana, { nombre: "X", equipoIds: [ajeno] })).status,
		).toBe(400);
		expect(
			(await post(ruta, t.beto, { nombre: "X", equipoIds: [plataforma] }))
				.status,
		).toBe(403);
	});

	it("el admin crea con integrantes sueltos; un miembro lo ve y filtra por estado", async () => {
		const crear = await post(org(acme, "/proyectos"), t.ana, {
			nombre: "Lanzamiento",
			equipoIds: [plataforma],
			integranteIds: [id.caro],
		});
		expect(crear.status).toBe(201);
		const proyecto = await crear.json();
		expect(proyecto).toMatchObject({
			estado: "activo",
			equipoIds: [plataforma],
			integranteIds: [id.caro],
		});

		const activos = await (
			await api(org(acme, "/proyectos?estado=activo"), { token: t.beto })
		).json();
		expect(activos.map((p: { id: number }) => p.id)).toEqual([proyecto.id]);
		const terminados = await (
			await api(org(acme, "/proyectos?estado=terminado"), { token: t.beto })
		).json();
		expect(terminados).toEqual([]);
	});

	it("no se elimina el único equipo de un proyecto; con otro, sí", async () => {
		const [proyecto] = await (
			await api(org(acme, "/proyectos"), { token: t.ana })
		).json();
		const borrar = await api(org(acme, `/equipos/${plataforma}`), {
			method: "DELETE",
			token: t.ana,
		});
		expect(borrar.status).toBe(409);

		await api(org(acme, `/proyectos/${proyecto.id}`), {
			method: "PUT",
			token: t.ana,
			body: { equipoIds: [plataforma, movil], estado: "en_pausa" },
		});
		expect(
			(
				await api(org(acme, `/equipos/${plataforma}`), {
					method: "DELETE",
					token: t.ana,
				})
			).status,
		).toBe(204);
		const despues = await (
			await api(org(acme, `/proyectos/${proyecto.id}`), { token: t.ana })
		).json();
		expect(despues).toMatchObject({ equipoIds: [movil], estado: "en_pausa" });
	});

	it("salir de la organización quita al integrante suelto", async () => {
		const [proyecto] = await (
			await api(org(acme, "/proyectos"), { token: t.ana })
		).json();
		// caro está en «movil» con beto: añadimos a ana para que pueda salir (RN-26).
		await api(org(acme, `/equipos/${movil}`), {
			method: "PUT",
			token: t.ana,
			body: { miembroIds: [id.ana, id.beto, id.caro] },
		});
		expect(
			(
				await api(org(acme, `/miembros/${id.caro}`), {
					method: "DELETE",
					token: t.caro,
				})
			).status,
		).toBe(204);
		const despues = await (
			await api(org(acme, `/proyectos/${proyecto.id}`), { token: t.ana })
		).json();
		expect(despues.integranteIds).toEqual([]);
	});

	it("aislamiento: quien no es miembro recibe 404 (RN-90)", async () => {
		const [proyecto] = await (
			await api(org(acme, "/proyectos"), { token: t.ana })
		).json();
		expect((await api(org(acme, "/proyectos"), { token: t.zoe })).status).toBe(
			404,
		);
		expect(
			(await api(org(otra, `/proyectos/${proyecto.id}`), { token: t.zoe }))
				.status,
		).toBe(404);
	});

	it("eliminar exige proyectos:eliminar", async () => {
		const [proyecto] = await (
			await api(org(acme, "/proyectos"), { token: t.ana })
		).json();
		const ruta = org(acme, `/proyectos/${proyecto.id}`);
		expect((await api(ruta, { method: "DELETE", token: t.beto })).status).toBe(
			403,
		);
		expect((await api(ruta, { method: "DELETE", token: t.ana })).status).toBe(
			204,
		);
		expect((await api(ruta, { token: t.ana })).status).toBe(404);
	});
});
