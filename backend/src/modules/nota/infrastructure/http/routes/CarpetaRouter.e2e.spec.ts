import { beforeAll, describe, expect, it } from "bun:test";
import { api, crearUsuario, login } from "@/test/e2e";

// Emails propios y sin vaciar: otros e2e vacían los usuarios al empezar.
describe("Carpetas de notas (e2e)", () => {
	let ana: string;
	let beto: string;

	const enviar = (
		token: string,
		method: string,
		ruta: string,
		body?: unknown,
	) => api(ruta, { method, token, body });
	const json = (token: string, ruta: string) =>
		api(ruta, { token }).then((r) => r.json());
	const titulos = (pagina: { datos: { titulo: string }[] }) =>
		pagina.datos.map((n) => n.titulo).sort();

	beforeAll(async () => {
		await crearUsuario("ana@carpetas.dev", "USUARIO");
		await crearUsuario("beto@carpetas.dev", "USUARIO");
		ana = await login("ana@carpetas.dev");
		beto = await login("beto@carpetas.dev");
	});

	it("árbol de carpetas, notas dentro, filtros y borrado que sube el contenido", async () => {
		const viajes = await (
			await enviar(ana, "POST", "/api/carpetas", {
				nombre: "Viajes",
				icono: "✈️",
				color: "#f59e0b",
			})
		).json();
		const europa = await (
			await enviar(ana, "POST", "/api/carpetas", {
				nombre: "Europa",
				padreId: viajes.id,
			})
		).json();
		expect(europa).toMatchObject({ padreId: viajes.id, icono: null });

		const lisboa = await (
			await enviar(ana, "POST", "/api/notas", {
				titulo: "Lisboa",
				carpetaId: europa.id,
			})
		).json();
		expect(lisboa).toMatchObject({
			carpetaId: europa.id,
			createdAt: expect.any(String),
		});
		await enviar(ana, "POST", "/api/notas", { titulo: "Raíz" });

		expect(
			titulos(await json(ana, `/api/notas?carpetaId=${europa.id}`)),
		).toEqual(["Lisboa"]);
		expect(titulos(await json(ana, "/api/notas?titulo=LISBOA"))).toEqual([
			"Lisboa",
		]);
		const futuro = new Date(Date.now() + 60_000).toISOString();
		expect(
			(await json(ana, `/api/notas?creadaDesde=${futuro}`)).totalElementos,
		).toBe(0);
		expect(
			(await json(ana, `/api/notas?editadaHasta=${futuro}`)).totalElementos,
		).toBe(2);

		// Ciclo: Viajes dentro de Europa (su hija).
		const ciclo = await enviar(ana, "PUT", `/api/carpetas/${viajes.id}`, {
			padreId: europa.id,
		});
		expect(ciclo.status).toBe(400);

		// Beto no las ve ni las usa.
		expect(await json(beto, "/api/carpetas")).toEqual([]);
		expect(
			(await enviar(beto, "PUT", `/api/carpetas/${viajes.id}`, { nombre: "x" }))
				.status,
		).toBe(404);
		expect(
			(
				await enviar(beto, "POST", "/api/notas", {
					titulo: "x",
					carpetaId: viajes.id,
				})
			).status,
		).toBe(400);

		// Al borrar Europa, Lisboa sube a Viajes.
		expect(
			(await enviar(ana, "DELETE", `/api/carpetas/${europa.id}`)).status,
		).toBe(204);
		expect(
			(await json(ana, "/api/carpetas")).map(
				(c: { nombre: string }) => c.nombre,
			),
		).toEqual(["Viajes"]);
		expect(await json(ana, `/api/notas/${lisboa.id}`)).toMatchObject({
			carpetaId: viajes.id,
		});
	});

	it("importa un vault de Obsidian con su árbol de carpetas", async () => {
		const res = await enviar(ana, "POST", "/api/notas/importar", {
			notas: [
				{
					carpeta: ["Vault", "Ideas"],
					titulo: "App",
					contenido: "Ver [[Otra]]",
				},
				{ carpeta: ["Vault"], titulo: "Otra", contenido: "" },
			],
		});
		expect(res.status).toBe(201);
		expect(await res.json()).toEqual({ notas: 2, carpetas: 2 });

		const carpetas: { id: number; nombre: string }[] = await json(
			ana,
			"/api/carpetas",
		);
		const ideas = carpetas.find((c) => c.nombre === "Ideas");
		expect(
			titulos(await json(ana, `/api/notas?carpetaId=${ideas?.id}`)),
		).toEqual(["App"]);
	});
});
