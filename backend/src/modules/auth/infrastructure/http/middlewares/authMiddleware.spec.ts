import { describe, expect, it } from "bun:test";
import { Hono } from "hono";
import { AuthMiddleware, type AuthEnv } from "./authMiddleware";

const payload = { id: 1, email: "a@x.com", roles: ["USUARIO"] };

const tokenService = {
	verificarToken: (token: string) => {
		if (token !== "valido") throw new Error("jwt malformed");
		return payload;
	},
};

const app = new Hono<AuthEnv>();
const tokensPersonales = {
	ejecutar: async (token: string) => (token === "cfp_valido" ? payload : null),
};
const middleware = new AuthMiddleware(tokenService as never, tokensPersonales);
app.get("/", middleware.handle, (c) => c.json(c.get("usuario")));
app.get("/sesion", middleware.handle, middleware.soloSesion, (c) =>
	c.text("ok"),
);

const request = (autorizacion?: string, ruta = "/") =>
	app.request(ruta, {
		headers: autorizacion ? { Authorization: autorizacion } : {},
	});

describe("AuthMiddleware", () => {
	it("debería publicar el usuario del token en el contexto", async () => {
		const res = await request("Bearer valido");

		expect(res.status).toBe(200);
		expect(await res.json()).toEqual(payload);
	});

	it("debería publicar el usuario de un token personal", async () => {
		const res = await request("Bearer cfp_valido");

		expect(res.status).toBe(200);
		expect(await res.json()).toEqual(payload);
	});

	it("soloSesion debería aceptar un JWT y rechazar un token personal", async () => {
		expect((await request("Bearer valido", "/sesion")).status).toBe(200);
		expect((await request("Bearer cfp_valido", "/sesion")).status).toBe(403);
	});

	it("un fallo al resolver un token personal no debería parecer un token inválido", async () => {
		const conFallo = new Hono<AuthEnv>();
		conFallo.get(
			"/",
			new AuthMiddleware(tokenService as never, {
				ejecutar: () => Promise.reject(new Error("BD caída")),
			}).handle,
			(c) => c.text("ok"),
		);

		const res = await conFallo.request("/", {
			headers: { Authorization: "Bearer cfp_valido" },
		});

		expect(res.status).toBe(500);
	});

	it.each([
		["sin header", undefined],
		["sin esquema Bearer", "valido"],
		["Bearer vacío", "Bearer "],
		["token inválido", "Bearer otro"],
		["token personal inválido", "Bearer cfp_otro"],
	])("debería responder 401 %s", async (_, autorizacion) => {
		const res = await request(autorizacion);

		expect(res.status).toBe(401);
	});
});
