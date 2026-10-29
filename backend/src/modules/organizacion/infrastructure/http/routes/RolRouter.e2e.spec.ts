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

describe("Roles de organización (e2e)", () => {
	const t: Record<string, string> = {};
	const ids: Record<string, number> = {};
	let acme: number;
	let otra: number;

	const crearOrg = async (token: string, nombre: string) =>
		(
			await (
				await api("/api/organizaciones", {
					method: "POST",
					token,
					body: { nombre, color: "#6366f1" },
				})
			).json()
		).id as number;

	beforeAll(async () => {
		await vaciarUsuarios();
		for (const quien of ["ana", "beto", "zoe"]) {
			ids[quien] = (await crearUsuario(`${quien}@rol.dev`, "USUARIO")).id;
			t[quien] = await login(`${quien}@rol.dev`);
		}
		acme = await crearOrg(t.ana, "Acme");
		otra = await crearOrg(t.zoe, "Otra");
		await api(`/api/organizaciones/${acme}/invitaciones`, {
			method: "POST",
			token: t.ana,
			body: { email: "beto@rol.dev" },
		});
		await api("/api/invitaciones/aceptar", {
			method: "POST",
			token: t.beto,
			body: { token: correos.at(-1)?.texto.match(/token=([a-f0-9]{64})/)?.[1] },
		});
	});

	const invitarComoBeto = () =>
		api(`/api/organizaciones/${acme}/invitaciones`, {
			method: "POST",
			token: t.beto,
			body: { email: `x${Date.now()}@rol.dev` },
		});

	it("el catálogo trae los permisos y las plantillas", async () => {
		const res = await api(`/api/organizaciones/${acme}/roles/catalogo`, {
			token: t.beto,
		});
		const { permisos, plantillas } = await res.json();
		expect(permisos).toContain("miembros:invitar");
		expect(plantillas.map((p: { nombre: string }) => p.nombre)).toEqual([
			"Editor",
			"Lector",
		]);
	});

	it("un rol da permisos y quitarlo los retira", async () => {
		expect((await invitarComoBeto()).status).toBe(403);

		const crear = await api(`/api/organizaciones/${acme}/roles`, {
			method: "POST",
			token: t.ana,
			body: { nombre: "Reclutador", permisos: ["miembros:invitar"] },
		});
		expect(crear.status).toBe(201);
		const rol = await crear.json();

		const asignar = (rolIds: number[]) =>
			api(`/api/organizaciones/${acme}/miembros/${ids.beto}/roles`, {
				method: "PUT",
				token: t.ana,
				body: { rolIds },
			});
		expect((await asignar([rol.id])).status).toBe(204);

		const vista = await (
			await api(`/api/organizaciones/${acme}`, { token: t.beto })
		).json();
		expect(vista.permisos).toEqual(["miembros:invitar"]);
		expect((await invitarComoBeto()).status).toBe(201);

		const miembros = await (
			await api(`/api/organizaciones/${acme}/miembros`, { token: t.ana })
		).json();
		expect(
			miembros.find((m: { usuarioId: number }) => m.usuarioId === ids.beto)
				.roles,
		).toEqual([{ id: rol.id, nombre: "Reclutador" }]);

		// Con el rol no puede gestionar roles (no tiene roles:gestionar).
		const escalar = await api(`/api/organizaciones/${acme}/roles`, {
			method: "POST",
			token: t.beto,
			body: { nombre: "Todo", permisos: ["roles:gestionar"] },
		});
		expect(escalar.status).toBe(403);

		expect((await asignar([])).status).toBe(204);
		expect((await invitarComoBeto()).status).toBe(403);
	});

	it("borrar el rol lo quita a quien lo tenga", async () => {
		const rol = await (
			await api(`/api/organizaciones/${acme}/roles`, {
				method: "POST",
				token: t.ana,
				body: { nombre: "Temporal", permisos: ["miembros:invitar"] },
			})
		).json();
		await api(`/api/organizaciones/${acme}/miembros/${ids.beto}/roles`, {
			method: "PUT",
			token: t.ana,
			body: { rolIds: [rol.id] },
		});
		expect((await invitarComoBeto()).status).toBe(201);

		const borrar = await api(`/api/organizaciones/${acme}/roles/${rol.id}`, {
			method: "DELETE",
			token: t.ana,
		});
		expect(borrar.status).toBe(204);
		expect((await invitarComoBeto()).status).toBe(403);
	});

	it("valida el catálogo, el nombre único y el aislamiento entre organizaciones", async () => {
		const fuera = await api(`/api/organizaciones/${acme}/roles`, {
			method: "POST",
			token: t.ana,
			body: { nombre: "Raro", permisos: ["usuarios:eliminar"] },
		});
		expect(fuera.status).toBe(400);

		const repetido = await api(`/api/organizaciones/${acme}/roles`, {
			method: "POST",
			token: t.ana,
			body: { nombre: "RECLUTADOR", permisos: [] },
		});
		expect(repetido.status).toBe(409);

		// Un rol de otra organización no se puede asignar aquí...
		const ajeno = await (
			await api(`/api/organizaciones/${otra}/roles`, {
				method: "POST",
				token: t.zoe,
				body: { nombre: "Ajeno", permisos: ["miembros:invitar"] },
			})
		).json();
		const asignarAjeno = await api(
			`/api/organizaciones/${acme}/miembros/${ids.beto}/roles`,
			{ method: "PUT", token: t.ana, body: { rolIds: [ajeno.id] } },
		);
		expect(asignarAjeno.status).toBe(404);

		// ...ni verse, editarse o borrarse desde fuera.
		expect(
			(await api(`/api/organizaciones/${otra}/roles`, { token: t.ana })).status,
		).toBe(404);
		const editarAjeno = await api(
			`/api/organizaciones/${acme}/roles/${ajeno.id}`,
			{ method: "PUT", token: t.ana, body: { nombre: "Mío", permisos: [] } },
		);
		expect(editarAjeno.status).toBe(404);
	});
});
