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

describe("Equipos (e2e)", () => {
	const t: Record<string, string> = {};
	const id: Record<string, number> = {};
	let acme: number;
	let otra: number;
	const equipos = (org: number, ruta = "") =>
		`/api/organizaciones/${org}/equipos${ruta}`;

	beforeAll(async () => {
		await vaciarUsuarios();
		for (const quien of ["ana", "beto", "caro", "zoe"]) {
			await crearUsuario(`${quien}@equipo.dev`, "USUARIO");
			t[quien] = await login(`${quien}@equipo.dev`);
		}
		const crearOrg = async (token: string) =>
			(
				await (
					await api("/api/organizaciones", {
						method: "POST",
						token,
						body: { nombre: "Org", color: "#6366f1" },
					})
				).json()
			).id as number;
		acme = await crearOrg(t.ana);
		otra = await crearOrg(t.zoe);
		for (const quien of ["beto", "caro"]) {
			await api(`/api/organizaciones/${acme}/invitaciones`, {
				method: "POST",
				token: t.ana,
				body: { email: `${quien}@equipo.dev` },
			});
			await api("/api/invitaciones/aceptar", {
				method: "POST",
				token: t[quien],
				body: {
					token: correos.at(-1)?.texto.match(/token=([a-f0-9]{64})/)?.[1],
				},
			});
		}
		const miembros = await (
			await api(`/api/organizaciones/${acme}/miembros`, { token: t.ana })
		).json();
		for (const m of miembros as { email: string; usuarioId: number }[]) {
			id[m.email.split("@")[0]] = m.usuarioId;
		}
		const zoe = await (
			await api(`/api/organizaciones/${otra}/miembros`, { token: t.zoe })
		).json();
		id.zoe = zoe[0].usuarioId;
	});

	it("crear exige 2 miembros de la organización y equipos:crear", async () => {
		const uno = await api(equipos(acme), {
			method: "POST",
			token: t.ana,
			body: { nombre: "Solo", color: "#6366f1", miembroIds: [id.ana] },
		});
		expect(uno.status).toBe(400);

		const ajeno = await api(equipos(acme), {
			method: "POST",
			token: t.ana,
			body: { nombre: "X", color: "#6366f1", miembroIds: [id.ana, id.zoe] },
		});
		expect(ajeno.status).toBe(400);

		const porBeto = await api(equipos(acme), {
			method: "POST",
			token: t.beto,
			body: { nombre: "X", color: "#6366f1", miembroIds: [id.ana, id.beto] },
		});
		expect(porBeto.status).toBe(403);
	});

	it("el admin crea con líder; el líder elige delegados y otro miembro no", async () => {
		const crear = await api(equipos(acme), {
			method: "POST",
			token: t.ana,
			body: {
				nombre: "Plataforma",
				color: "#6366f1",
				miembroIds: [id.beto, id.caro],
				liderId: id.beto,
			},
		});
		expect(crear.status).toBe(201);
		const equipo = await crear.json();
		expect(equipo.liderId).toBe(id.beto);

		const porCaro = await api(equipos(acme, `/${equipo.id}/delegados`), {
			method: "PUT",
			token: t.caro,
			body: { usuarioIds: [id.caro] },
		});
		expect(porCaro.status).toBe(403);

		const porBeto = await api(equipos(acme, `/${equipo.id}/delegados`), {
			method: "PUT",
			token: t.beto,
			body: { usuarioIds: [id.caro] },
		});
		expect(porBeto.status).toBe(200);
		expect((await porBeto.json()).miembros).toContainEqual({
			usuarioId: id.caro,
			puedeCrearTareas: true,
		});
	});

	it("con 2 miembros nadie sale de la organización ni se le expulsa (RN-26)", async () => {
		const salir = await api(`/api/organizaciones/${acme}/miembros/${id.caro}`, {
			method: "DELETE",
			token: t.caro,
		});
		expect(salir.status).toBe(409);
		const expulsar = await api(
			`/api/organizaciones/${acme}/miembros/${id.beto}`,
			{ method: "DELETE", token: t.ana },
		);
		expect(expulsar.status).toBe(409);
	});

	it("con 3 miembros, salir de la organización lo quita del equipo", async () => {
		const [equipo] = await (await api(equipos(acme), { token: t.ana })).json();
		await api(equipos(acme, `/${equipo.id}`), {
			method: "PUT",
			token: t.ana,
			body: { miembroIds: [id.ana, id.beto, id.caro] },
		});
		const salir = await api(`/api/organizaciones/${acme}/miembros/${id.caro}`, {
			method: "DELETE",
			token: t.caro,
		});
		expect(salir.status).toBe(204);
		const despues = await (
			await api(equipos(acme, `/${equipo.id}`), { token: t.ana })
		).json();
		expect(
			despues.miembros.map((m: { usuarioId: number }) => m.usuarioId),
		).toEqual([id.ana, id.beto].sort((a, b) => a - b));
	});

	it("filtra por tag de la organización y rechaza tags ajenos", async () => {
		const tag = await (
			await api(`/api/organizaciones/${acme}/tags`, {
				method: "POST",
				token: t.ana,
				body: { nombre: "backend" },
			})
		).json();
		const ajeno = await (
			await api("/api/tags", {
				method: "POST",
				token: t.ana,
				body: { nombre: "personal" },
			})
		).json();
		const [equipo] = await (await api(equipos(acme), { token: t.ana })).json();

		const conAjeno = await api(equipos(acme, `/${equipo.id}`), {
			method: "PUT",
			token: t.ana,
			body: { tagIds: [ajeno.id] },
		});
		expect(conAjeno.status).toBe(400);

		await api(equipos(acme, `/${equipo.id}`), {
			method: "PUT",
			token: t.ana,
			body: { tagIds: [tag.id] },
		});
		const filtrados = await (
			await api(equipos(acme, `?tagId=${tag.id}`), { token: t.beto })
		).json();
		expect(filtrados.map((e: { id: number }) => e.id)).toEqual([equipo.id]);
		const otroTag = await (
			await api(equipos(acme, `?tagId=${ajeno.id}`), { token: t.beto })
		).json();
		expect(otroTag).toEqual([]);
	});

	it("aislamiento: quien no es miembro recibe 404 (RN-90)", async () => {
		const [equipo] = await (await api(equipos(acme), { token: t.ana })).json();
		expect((await api(equipos(acme), { token: t.zoe })).status).toBe(404);
		expect(
			(await api(equipos(acme, `/${equipo.id}`), { token: t.zoe })).status,
		).toBe(404);
		expect(
			(await api(equipos(otra, `/${equipo.id}`), { token: t.zoe })).status,
		).toBe(404);
	});

	it("eliminar exige equipos:eliminar y libera la salida", async () => {
		const [equipo] = await (await api(equipos(acme), { token: t.ana })).json();
		expect(
			(
				await api(equipos(acme, `/${equipo.id}`), {
					method: "DELETE",
					token: t.beto,
				})
			).status,
		).toBe(403);
		expect(
			(
				await api(equipos(acme, `/${equipo.id}`), {
					method: "DELETE",
					token: t.ana,
				})
			).status,
		).toBe(204);
		expect(
			(await api(equipos(acme), { token: t.ana })).json(),
		).resolves.toEqual([]);
	});
});
