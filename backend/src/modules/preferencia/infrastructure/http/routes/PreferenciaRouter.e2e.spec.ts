import { beforeAll, describe, expect, it } from "bun:test";
import { api, crearUsuario, login, vaciarUsuarios } from "@/test/e2e";

describe("Preferencias de interfaz (e2e)", () => {
	const t: Record<string, string> = {};
	const ruta = "/api/preferencias";

	beforeAll(async () => {
		await vaciarUsuarios();
		for (const quien of ["ana", "beto"]) {
			await crearUsuario(`${quien}@preferencias.dev`, "USUARIO");
			t[quien] = await login(`${quien}@preferencias.dev`);
		}
	});

	it("sin guardar nada, devuelve las predeterminadas", async () => {
		const res = await api(ruta, { token: t.ana });
		expect(res.status).toBe(200);
		expect(await res.json()).toMatchObject({
			markdownFuente: "inter",
			pendientesNotas: false,
			pendientesOrganizaciones: null,
		});
	});

	it("guarda solo lo enviado y cada usuario ve las suyas", async () => {
		const put = await api(ruta, {
			method: "PUT",
			token: t.ana,
			body: { markdownFuente: "serif", pendientesOrganizaciones: 30 },
		});
		expect(put.status).toBe(200);

		expect(await (await api(ruta, { token: t.ana })).json()).toMatchObject({
			markdownFuente: "serif",
			markdownTamano: "normal",
			pendientesOrganizaciones: 30,
		});
		expect(await (await api(ruta, { token: t.beto })).json()).toMatchObject({
			markdownFuente: "inter",
		});
	});

	it("rechaza opciones o valores desconocidos", async () => {
		for (const body of [{ markdownFuente: "comic" }, { otra: true }]) {
			expect(
				(await api(ruta, { method: "PUT", token: t.ana, body })).status,
			).toBe(400);
		}
	});
});
