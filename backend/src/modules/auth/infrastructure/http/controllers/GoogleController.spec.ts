import { describe, expect, it, mock } from "bun:test";
import { Hono } from "hono";
import { GoogleController } from "./GoogleController";

function crearApp(refreshToken = "rt-google-123") {
	const app = new Hono();
	const controller = new GoogleController({
		google: {
			urlAutorizacion: () => "https://accounts.google.com/o/oauth2/v2/auth",
			obtenerPerfil: mock(),
		} as never,
		loginGoogle: {
			ejecutar: mock(async () => ({
				accessToken: "at-123",
				refreshToken,
			})),
		} as never,
	});
	app.get("/api/auth/google/callback", controller.callback);
	return app;
}

describe("GoogleController", () => {
	it("en flujo web fija la cookie refresh_token con SameSite=Lax y Max-Age de 30 días", async () => {
		const app = crearApp();
		const res = await app.request(
			"/api/auth/google/callback?code=codigo&state=estado123",
			{
				headers: {
					Cookie: "google_oauth=estado123.verifier456",
				},
			},
		);

		expect(res.status).toBe(302);
		expect(res.headers.get("location")).toEndWith("/login/google");

		const cookies = res.headers.getSetCookie();
		const cookieRefresh = cookies.find((c) => c.startsWith("refresh_token="));
		expect(cookieRefresh).toBeDefined();
		expect(cookieRefresh).toContain("SameSite=Lax");
		expect(cookieRefresh).toContain("Max-Age=2592000");
		expect(cookieRefresh).toContain("HttpOnly");
	});

	it("en flujo móvil no fija la cookie refresh_token en el navegador", async () => {
		const app = crearApp("rt-movil-999");
		const res = await app.request(
			"/api/auth/google/callback?code=codigo&state=estado123.movil",
			{
				headers: {
					Cookie: "google_oauth=estado123.movil.verifier456",
				},
			},
		);

		expect(res.status).toBe(200);
		const html = await res.text();
		expect(html).toContain(
			"cosmoflow://login-callback?refreshToken=rt-movil-999",
		);

		const cookies = res.headers.getSetCookie();
		const cookieRefresh = cookies.find((c) => c.startsWith("refresh_token="));
		expect(cookieRefresh).toBeUndefined();
	});
});
