import { beforeAll, describe, expect, it } from "bun:test";
import { app } from "@/core/shared/infrastructure/http/server";
import { api, crearUsuario, login } from "@/test/e2e";

const PNG = new Uint8Array([
	0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 1, 2,
]);

function subir(token: string | null, datos: Uint8Array) {
	const form = new FormData();
	form.append("archivo", new File([datos], "a.png", { type: "image/png" }));
	return app.request("/api/adjuntos", {
		method: "POST",
		headers: token ? { Authorization: `Bearer ${token}` } : {},
		body: form,
	});
}

// Emails propios y sin vaciar: otros e2e vacían los usuarios al empezar.
describe("Adjuntos (e2e)", () => {
	let ana: string;
	let beto: string;

	beforeAll(async () => {
		await crearUsuario("ana@adjuntos.dev", "USUARIO");
		await crearUsuario("beto@adjuntos.dev", "USUARIO");
		ana = await login("ana@adjuntos.dev");
		beto = await login("beto@adjuntos.dev");
	});

	it("sin token → 401", async () => {
		expect((await subir(null, PNG)).status).toBe(401);
	});

	it("rechaza lo que no es imagen (400) y lo que pasa de 5 MB (413)", async () => {
		expect(
			(await subir(ana, new TextEncoder().encode("<script>"))).status,
		).toBe(400);
		const grande = new Uint8Array(6 * 1024 * 1024);
		grande.set(PNG);
		expect((await subir(ana, grande)).status).toBe(413);
	});

	it("sube una imagen y solo la sirve a su dueño", async () => {
		const subida = await subir(ana, PNG);
		expect(subida.status).toBe(201);
		const { url, tipo } = await subida.json();
		expect(url).toMatch(/^\/api\/adjuntos\/\d+$/);
		expect(tipo).toBe("image/png");

		const imagen = await api(url, { token: ana });
		expect(imagen.status).toBe(200);
		expect(imagen.headers.get("content-type")).toBe("image/png");
		expect(new Uint8Array(await imagen.arrayBuffer())).toEqual(PNG);

		expect((await api(url, { token: beto })).status).toBe(404);
		expect((await api(url)).status).toBe(401);
	});
});
