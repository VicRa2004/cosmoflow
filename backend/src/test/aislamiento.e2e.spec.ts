import { beforeAll, describe, expect, it } from "bun:test";
import { app } from "@/core/shared/infrastructure/http/server";
import { api, crearUsuario, login } from "@/test/e2e";

const PNG = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 1]);

function subirImagen(token: string) {
	const form = new FormData();
	form.append("archivo", new File([PNG], "a.png", { type: "image/png" }));
	return app.request("/api/adjuntos", {
		method: "POST",
		headers: { Authorization: `Bearer ${token}` },
		body: form,
	});
}

/**
 * Cierre de la Fase 1: ningún recurso personal se ve ni se toca desde otra
 * cuenta, sin permiso no se entra y lo borrado no reaparece por ningún camino.
 * Emails propios y sin vaciar: otros e2e vacían los usuarios al empezar.
 */
describe("Aislamiento entre usuarios y permisos (e2e)", () => {
	let ana: string;
	let beto: string;
	const deAna = { tag: 0, tarea: 0, nota: 0, adjunto: "" };

	const post = (token: string, ruta: string, body: unknown) =>
		api(ruta, { method: "POST", token, body }).then((r) => r.json());

	beforeAll(async () => {
		await crearUsuario("ana@aislamiento.dev", "USUARIO");
		await crearUsuario("beto@aislamiento.dev", "USUARIO");
		ana = await login("ana@aislamiento.dev");
		beto = await login("beto@aislamiento.dev");

		deAna.tag = (await post(ana, "/api/tags", { nombre: "secreto" })).id;
		const datos = {
			titulo: "Secreto",
			contenido: "clave",
			tagIds: [deAna.tag],
		};
		deAna.tarea = (await post(ana, "/api/tareas", datos)).id;
		deAna.nota = (await post(ana, "/api/notas", datos)).id;
		deAna.adjunto = (await (await subirImagen(ana)).json()).url;
	});

	it("otro usuario recibe 404 en cada recurso ajeno, para leer, editar o borrar", async () => {
		const rutas = [
			`/api/tags/${deAna.tag}`,
			`/api/tareas/${deAna.tarea}`,
			`/api/notas/${deAna.nota}`,
		];
		for (const ruta of rutas) {
			expect([ruta, (await api(ruta, { token: beto })).status]).toEqual([
				ruta,
				404,
			]);
			const editar = await api(ruta, {
				method: "PUT",
				token: beto,
				body: { titulo: "mío", nombre: "mío" },
			});
			expect([ruta, editar.status]).toEqual([ruta, 404]);
			const borrar = await api(ruta, { method: "DELETE", token: beto });
			expect([ruta, borrar.status]).toEqual([ruta, 404]);
		}
		expect((await api(deAna.adjunto, { token: beto })).status).toBe(404);
	});

	it("los listados, búsquedas y filtros no dejan ver nada ajeno", async () => {
		const listados = [
			"/api/tags",
			"/api/tareas",
			"/api/tareas/pendientes",
			"/api/notas",
			"/api/tareas?busqueda=Secreto",
			"/api/notas?busqueda=clave",
			`/api/tareas?tagId=${deAna.tag}`,
			`/api/notas?tagId=${deAna.tag}`,
		];
		for (const ruta of listados) {
			const { totalElementos } = await (
				await api(ruta, { token: beto })
			).json();
			expect([ruta, totalElementos]).toEqual([ruta, 0]);
		}
	});

	it("no se puede usar el tag de otro en una tarea o nota propia (400)", async () => {
		for (const ruta of ["/api/tareas", "/api/notas"]) {
			const res = await api(ruta, {
				method: "POST",
				token: beto,
				body: { titulo: "x", tagIds: [deAna.tag] },
			});
			expect([ruta, res.status]).toEqual([ruta, 400]);
		}
	});

	it("tras los intentos ajenos, lo de la dueña sigue intacto", async () => {
		const tarea = await (
			await api(`/api/tareas/${deAna.tarea}`, { token: ana })
		).json();
		const nota = await (
			await api(`/api/notas/${deAna.nota}`, { token: ana })
		).json();
		expect(tarea).toMatchObject({ titulo: "Secreto", tagIds: [deAna.tag] });
		expect(nota).toMatchObject({ titulo: "Secreto", tagIds: [deAna.tag] });
		expect((await api(deAna.adjunto, { token: ana })).status).toBe(200);
	});

	it("sin permisos sobre los recursos personales → 403", async () => {
		// Un usuario sin roles: autenticado, pero sin `tags|tareas|notas|adjuntos:*`.
		await crearUsuario("carla@aislamiento.dev");
		const carla = await login("carla@aislamiento.dev");

		for (const ruta of [
			"/api/tags",
			"/api/tareas",
			"/api/tareas/pendientes",
			"/api/notas",
		]) {
			expect([ruta, (await api(ruta, { token: carla })).status]).toEqual([
				ruta,
				403,
			]);
		}
		for (const ruta of ["/api/tags", "/api/tareas", "/api/notas"]) {
			const res = await api(ruta, {
				method: "POST",
				token: carla,
				body: { titulo: "x", nombre: "x" },
			});
			expect([ruta, res.status]).toEqual([ruta, 403]);
		}
		expect((await subirImagen(carla)).status).toBe(403);
		expect((await api(deAna.adjunto, { token: carla })).status).toBe(403);
	});

	it("lo borrado no reaparece: ni en listados, ni en pendientes, ni como tag asignable", async () => {
		const tag = (await post(ana, "/api/tags", { nombre: "temporal" })).id;
		const tarea = (await post(ana, "/api/tareas", { titulo: "Temporal" })).id;
		const nota = (await post(ana, "/api/notas", { titulo: "Temporal" })).id;
		for (const ruta of [
			`/api/tags/${tag}`,
			`/api/tareas/${tarea}`,
			`/api/notas/${nota}`,
		]) {
			await api(ruta, { method: "DELETE", token: ana });
		}

		for (const ruta of [
			"/api/tags",
			"/api/tareas",
			"/api/tareas/pendientes",
			"/api/notas",
		]) {
			const pagina = await (await api(ruta, { token: ana })).json();
			const borrado = pagina.datos.some(
				(d: { titulo?: string; nombre?: string }) =>
					(d.titulo ?? d.nombre)?.toLowerCase() === "temporal",
			);
			expect([ruta, borrado]).toEqual([ruta, false]);
		}
		const conTagBorrado = await api("/api/tareas", {
			method: "POST",
			token: ana,
			body: { titulo: "x", tagIds: [tag] },
		});
		expect(conTagBorrado.status).toBe(400);
	});
});
