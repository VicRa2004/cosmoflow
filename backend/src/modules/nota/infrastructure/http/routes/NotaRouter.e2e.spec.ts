import { beforeAll, describe, expect, it } from "bun:test";
import { prisma } from "@/core/config/prisma";
import { api, crearUsuario, login } from "@/test/e2e";

// Emails propios y sin vaciar: otros e2e vacían los usuarios al empezar.
describe("Notas personales (e2e)", () => {
	let ana: string;
	let beto: string;
	let tagAna: number;
	let tagBeto: number;

	const post = (token: string, ruta: string, body: unknown) =>
		api(ruta, { method: "POST", token, body }).then((r) => r.json());
	const titulos = (pagina: { datos: { titulo: string }[] }) =>
		pagina.datos.map((n) => n.titulo);

	beforeAll(async () => {
		await crearUsuario("ana@notas.dev", "USUARIO");
		await crearUsuario("beto@notas.dev", "USUARIO");
		ana = await login("ana@notas.dev");
		beto = await login("beto@notas.dev");
		tagAna = (await post(ana, "/api/tags", { nombre: "viajes" })).id;
		tagBeto = (await post(beto, "/api/tags", { nombre: "viajes" })).id;
	});

	it("crea notas, busca en título y contenido y ordena por última edición", async () => {
		const lisboa = await post(ana, "/api/notas", {
			titulo: "Lisboa",
			contenido: "Ver el **tranvía** 28",
			tagIds: [tagAna],
		});
		expect(lisboa).toMatchObject({ titulo: "Lisboa", tagIds: [tagAna] });
		await post(ana, "/api/notas", { titulo: "Compra", contenido: "pan" });

		const todas = await (await api("/api/notas", { token: ana })).json();
		expect(titulos(todas)).toEqual(["Compra", "Lisboa"]);

		// Editar la sube arriba.
		await api(`/api/notas/${lisboa.id}`, {
			method: "PUT",
			token: ana,
			body: { contenido: "Ver el **tranvía** 28 y Belém" },
		});
		const despues = await (await api("/api/notas", { token: ana })).json();
		expect(titulos(despues)).toEqual(["Lisboa", "Compra"]);

		const porContenido = await (
			await api("/api/notas?busqueda=TRANVÍA", { token: ana })
		).json();
		expect(titulos(porContenido)).toEqual(["Lisboa"]);
		const porTag = await (
			await api(`/api/notas?tagId=${tagAna}`, { token: ana })
		).json();
		expect(titulos(porTag)).toEqual(["Lisboa"]);
	});

	it("una nota personal solo la ve su dueño (404) y no admite tags ajenos (400)", async () => {
		const [nota] = (await (await api("/api/notas", { token: ana })).json())
			.datos;

		expect(
			(await (await api("/api/notas", { token: beto })).json()).totalElementos,
		).toBe(0);
		expect((await api(`/api/notas/${nota.id}`, { token: beto })).status).toBe(
			404,
		);
		const editar = await api(`/api/notas/${nota.id}`, {
			method: "PUT",
			token: beto,
			body: { titulo: "mía" },
		});
		expect(editar.status).toBe(404);
		const borrar = await api(`/api/notas/${nota.id}`, {
			method: "DELETE",
			token: beto,
		});
		expect(borrar.status).toBe(404);

		const ajeno = await api("/api/notas", {
			method: "POST",
			token: ana,
			body: { titulo: "x", tagIds: [tagBeto] },
		});
		expect(ajeno.status).toBe(400);
	});

	it("borrado lógico: deja de verse pero la fila sigue", async () => {
		const { id } = await post(ana, "/api/notas", { titulo: "Borrar" });

		const res = await api(`/api/notas/${id}`, { method: "DELETE", token: ana });
		expect(res.status).toBe(204);
		expect((await api(`/api/notas/${id}`, { token: ana })).status).toBe(404);
		expect(await prisma.nota.findUnique({ where: { id } })).toMatchObject({
			deletedAt: expect.any(Date),
		});
	});
});
