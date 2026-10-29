import { beforeAll, describe, expect, it } from "bun:test";
import { prisma } from "@/core/config/prisma";
import { api, crearUsuario, login, vaciarUsuarios } from "@/test/e2e";

describe("Tareas personales (e2e)", () => {
	let ana: string;
	let beto: string;
	let tagAna: number;
	let tagBeto: number;

	const post = (token: string, ruta: string, body: unknown) =>
		api(ruta, { method: "POST", token, body });

	beforeAll(async () => {
		await vaciarUsuarios();
		await crearUsuario("ana@tareas.dev", "USUARIO");
		await crearUsuario("beto@tareas.dev", "USUARIO");
		ana = await login("ana@tareas.dev");
		beto = await login("beto@tareas.dev");
		tagAna = (await (await post(ana, "/api/tags", { nombre: "casa" })).json())
			.id;
		tagBeto = (await (await post(beto, "/api/tags", { nombre: "casa" })).json())
			.id;
	});

	it("crea una tarea con valores por defecto y sus tags", async () => {
		const res = await post(ana, "/api/tareas", {
			titulo: "Comprar pan",
			fechaVencimiento: "2026-11-15",
			tagIds: [tagAna],
		});

		expect(res.status).toBe(201);
		expect(await res.json()).toMatchObject({
			titulo: "Comprar pan",
			estado: "pendiente",
			prioridad: "media",
			fechaInicio: null,
			fechaVencimiento: "2026-11-15",
			tagIds: [tagAna],
		});
	});

	it("rechaza tags de otro usuario y fechas incoherentes (400)", async () => {
		const ajeno = await post(ana, "/api/tareas", {
			titulo: "x",
			tagIds: [tagBeto],
		});
		expect(ajeno.status).toBe(400);

		const fechas = await post(ana, "/api/tareas", {
			titulo: "x",
			fechaInicio: "2026-11-02",
			fechaVencimiento: "2026-11-01",
		});
		expect(fechas.status).toBe(400);
	});

	it("otro usuario no ve ni toca la tarea (404)", async () => {
		const { datos } = await (await api("/api/tareas", { token: ana })).json();
		const id = datos[0].id;

		expect(
			(await api("/api/tareas", { token: beto }).then((r) => r.json()))
				.totalElementos,
		).toBe(0);
		expect((await api(`/api/tareas/${id}`, { token: beto })).status).toBe(404);
		const editar = await api(`/api/tareas/${id}`, {
			method: "PUT",
			token: beto,
			body: { titulo: "mía" },
		});
		expect(editar.status).toBe(404);
		const borrar = await api(`/api/tareas/${id}`, {
			method: "DELETE",
			token: beto,
		});
		expect(borrar.status).toBe(404);
	});

	it("filtra por estado y por tag, y un tag borrado sale de la tarea", async () => {
		await post(ana, "/api/tareas", { titulo: "Hecha", estado: "completada" });

		const completadas = await (
			await api("/api/tareas?estado=completada", { token: ana })
		).json();
		expect(completadas.datos.map((t: { titulo: string }) => t.titulo)).toEqual([
			"Hecha",
		]);
		const conTag = await (
			await api(`/api/tareas?tagId=${tagAna}`, { token: ana })
		).json();
		expect(conTag.totalElementos).toBe(1);

		await api(`/api/tags/${tagAna}`, { method: "DELETE", token: ana });
		const tarea = conTag.datos[0];
		const despues = await (
			await api(`/api/tareas/${tarea.id}`, { token: ana })
		).json();
		expect(despues.tagIds).toEqual([]);
	});

	it("borrado lógico: deja de verse pero la fila sigue", async () => {
		const { id } = await (
			await post(ana, "/api/tareas", { titulo: "Borrar" })
		).json();

		const res = await api(`/api/tareas/${id}`, {
			method: "DELETE",
			token: ana,
		});
		expect(res.status).toBe(204);
		expect((await api(`/api/tareas/${id}`, { token: ana })).status).toBe(404);
		expect(await prisma.tarea.findUnique({ where: { id } })).toMatchObject({
			deletedAt: expect.any(Date),
		});
	});
});
