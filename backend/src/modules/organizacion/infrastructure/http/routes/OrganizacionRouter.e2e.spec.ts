import { beforeAll, describe, expect, it, spyOn } from "bun:test";
import { prisma } from "@/core/config/prisma";
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

describe("Organizaciones (e2e)", () => {
	let ana: string;
	let beto: string;
	let orgId: number;

	beforeAll(async () => {
		await vaciarUsuarios();
		await crearUsuario("ana@org.dev", "USUARIO");
		await crearUsuario("beto@org.dev", "USUARIO");
		ana = await login("ana@org.dev");
		beto = await login("beto@org.dev");

		const res = await api("/api/organizaciones", {
			method: "POST",
			token: ana,
			body: { nombre: "Acme", color: "#6366F1" },
		});
		expect(res.status).toBe(201);
		const creada = await res.json();
		expect(creada).toMatchObject({
			nombre: "Acme",
			descripcion: "",
			color: "#6366f1",
			avatarUrl: null,
			isAdmin: true,
		});
		orgId = creada.id;
	});

	it("quien no es miembro no la ve ni la toca (404, RN-90)", async () => {
		const lista = await api("/api/organizaciones", { token: beto });
		expect((await lista.json()).totalElementos).toBe(0);

		const url = `/api/organizaciones/${orgId}`;
		expect((await api(url, { token: beto })).status).toBe(404);
		expect(
			(await api(url, { method: "PUT", token: beto, body: { nombre: "Mía" } }))
				.status,
		).toBe(404);
		expect((await api(url, { method: "DELETE", token: beto })).status).toBe(
			404,
		);
		expect((await api(`${url}/avatar`, { token: beto })).status).toBe(404);
		expect(
			(await api(`${url}/avatar`, { method: "DELETE", token: beto })).status,
		).toBe(404);
	});

	it("un miembro la ve pero solo el administrador la personaliza (403)", async () => {
		await api(`/api/organizaciones/${orgId}/invitaciones`, {
			method: "POST",
			token: ana,
			body: { email: "beto@org.dev" },
		});
		const token = correos.at(-1)?.texto.match(/token=([a-f0-9]{64})/)?.[1];
		await api("/api/invitaciones/aceptar", {
			method: "POST",
			token: beto,
			body: { token },
		});
		const url = `/api/organizaciones/${orgId}`;

		const vista = await api(url, { token: beto });
		expect(await vista.json()).toMatchObject({
			nombre: "Acme",
			isAdmin: false,
		});
		expect(
			(await api(url, { method: "PUT", token: beto, body: { nombre: "Mía" } }))
				.status,
		).toBe(403);
		expect((await api(url, { method: "DELETE", token: beto })).status).toBe(
			403,
		);

		const editar = await api(url, {
			method: "PUT",
			token: ana,
			body: { descripcion: "Producto", color: "#000000" },
		});
		expect(await editar.json()).toMatchObject({
			nombre: "Acme",
			descripcion: "Producto",
			color: "#000000",
		});
	});

	it("lista por nombre o, con orden=recientes, la última en la que entró primero (beto: Acme y luego Zeta)", async () => {
		await api("/api/organizaciones", {
			method: "POST",
			token: beto,
			body: { nombre: "Zeta", color: "#6366f1" },
		});
		const nombres = async (query: string) =>
			(
				await (await api(`/api/organizaciones${query}`, { token: beto })).json()
			).datos.map((o: { nombre: string }) => o.nombre);
		expect(await nombres("")).toEqual(["Acme", "Zeta"]);
		expect(await nombres("?orden=recientes")).toEqual(["Zeta", "Acme"]);
	});

	it("valida el color y el tamaño del nombre", async () => {
		const res = await api("/api/organizaciones", {
			method: "POST",
			token: ana,
			body: { nombre: "x".repeat(101), color: "rojo" },
		});
		expect(res.status).toBe(400);
	});

	it("borrado lógico: deja de existir para todos sus miembros", async () => {
		const url = `/api/organizaciones/${orgId}`;
		expect((await api(url, { method: "DELETE", token: ana })).status).toBe(204);
		expect(
			await prisma.organizacion.findUnique({ where: { id: orgId } }),
		).toMatchObject({ deletedAt: expect.any(Date) });
		expect((await api(url, { token: ana })).status).toBe(404);
		expect((await api(url, { token: beto })).status).toBe(404);
		const lista = await api("/api/organizaciones", { token: ana });
		expect((await lista.json()).totalElementos).toBe(0);
	});
});
