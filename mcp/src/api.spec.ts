import { afterEach, describe, expect, it, spyOn } from "bun:test";
import { crearApi } from "./api";

const TOKEN = "cfp_secreto";

const responder = (cuerpo: unknown, status: number) =>
	spyOn(globalThis, "fetch").mockResolvedValue(
		new Response(JSON.stringify(cuerpo), { status }),
	);

describe("crearApi", () => {
	afterEach(() => {
		spyOn(globalThis, "fetch").mockRestore();
	});

	it("debería enviar el token como Bearer y devolver el JSON", async () => {
		const fetchFalso = responder({ id: 1 }, 201);

		const datos = await crearApi("http://localhost:3000", TOKEN)(
			"POST",
			"/api/tareas",
			{ titulo: "A" },
		);

		const [url, init] = fetchFalso.mock.calls[0] as [URL, RequestInit];
		expect(datos).toEqual({ id: 1 });
		expect(url.href).toBe("http://localhost:3000/api/tareas");
		expect(init.headers).toMatchObject({ Authorization: `Bearer ${TOKEN}` });
	});

	it.each([
		[
			"el mensaje de la API",
			404,
			{ error: "Tarea no encontrada" },
			"Tarea no encontrada",
		],
		[
			"el detalle de validación",
			400,
			{ error: "Mal", details: { a: 1 } },
			'Mal: {"a":1}',
		],
		["un 401 claro", 401, {}, "inválido o está revocado"],
		["el código si no hay mensaje", 502, {}, "respondió 502"],
	])("debería lanzar %s", async (_, status, cuerpo, esperado) => {
		responder(cuerpo, status);

		const llamada = crearApi("https://a.com", TOKEN)("GET", "/api/x");

		await expect(llamada).rejects.toThrow(esperado);
		await expect(llamada).rejects.not.toThrow(TOKEN);
	});

	it("debería rechazar http fuera de localhost", () => {
		expect(() => crearApi("http://a.com", TOKEN)).toThrow("https");
		expect(() => crearApi("no es una url", TOKEN)).toThrow();
	});
});
