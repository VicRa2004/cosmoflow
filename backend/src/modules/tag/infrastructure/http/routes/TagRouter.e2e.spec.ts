import { beforeAll, describe, expect, it } from "bun:test";
import { prisma } from "@/core/config/prisma";
import { api, crearUsuario, login, vaciarUsuarios } from "@/test/e2e";

describe("Tags personales (e2e)", () => {
	let ana: string;
	let beto: string;

	beforeAll(async () => {
		await vaciarUsuarios();
		await crearUsuario("ana@tags.dev", "USUARIO");
		await crearUsuario("beto@tags.dev", "USUARIO");
		ana = await login("ana@tags.dev");
		beto = await login("beto@tags.dev");
	});

	const crear = (token: string, nombre: string) =>
		api("/api/tags", { method: "POST", token, body: { nombre } });

	it("cada usuario solo ve y toca sus tags (404 con los de otro)", async () => {
		const res = await crear(ana, "urgente");
		expect(res.status).toBe(201);
		const { id } = await res.json();

		const lista = await api("/api/tags", { token: beto });
		expect((await lista.json()).totalElementos).toBe(0);

		expect((await api(`/api/tags/${id}`, { token: beto })).status).toBe(404);
		const editar = await api(`/api/tags/${id}`, {
			method: "PUT",
			token: beto,
			body: { nombre: "mío" },
		});
		expect(editar.status).toBe(404);
		const borrar = await api(`/api/tags/${id}`, {
			method: "DELETE",
			token: beto,
		});
		expect(borrar.status).toBe(404);

		// Otro usuario puede tener un tag con el mismo nombre.
		expect((await crear(beto, "urgente")).status).toBe(201);
	});

	it("el nombre es único por usuario sin contar los borrados", async () => {
		expect((await crear(ana, "URGENTE")).status).toBe(409);

		const { datos } = await (
			await api("/api/tags?nombre=urgente", { token: ana })
		).json();
		const id = datos[0].id;
		const borrar = await api(`/api/tags/${id}`, {
			method: "DELETE",
			token: ana,
		});
		expect(borrar.status).toBe(204);

		// Borrado lógico: la fila sigue en la BD pero ya no aparece.
		expect(await prisma.tag.findUnique({ where: { id } })).toMatchObject({
			deletedAt: expect.any(Date),
		});
		expect((await api(`/api/tags/${id}`, { token: ana })).status).toBe(404);
		expect((await crear(ana, "urgente")).status).toBe(201);
	});
});
