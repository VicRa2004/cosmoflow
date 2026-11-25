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

	const nonce = "a".repeat(32);

	it("en flujo de escritorio redirige al loopback de la app con el refresh token", async () => {
		const app = crearApp("rt-escritorio-1");
		const state = `estado123.escritorio-51234-${nonce}`;
		const res = await app.request(
			`/api/auth/google/callback?code=codigo&state=${state}`,
			{ headers: { Cookie: `google_oauth=${state}.verifier456` } },
		);

		expect(res.status).toBe(302);
		expect(res.headers.get("location")).toBe(
			`http://127.0.0.1:51234/${nonce}?refreshToken=rt-escritorio-1`,
		);
		const cookies = res.headers.getSetCookie();
		expect(cookies.some((c) => c.startsWith("refresh_token="))).toBe(false);
	});

	it("en flujo de escritorio con state inválido vuelve al loopback con error", async () => {
		const app = crearApp();
		const res = await app.request(
			`/api/auth/google/callback?code=codigo&state=otro.escritorio-51234-${nonce}`,
		);

		expect(res.headers.get("location")).toBe(
			`http://127.0.0.1:51234/${nonce}?error=google`,
		);
	});

	it("ignora destinos de escritorio malformados o con puerto reservado", async () => {
		const app = crearApp();
		for (const sufijo of [`80-${nonce}`, "51234-corto", `51234-${nonce}x`]) {
			const res = await app.request(
				`/api/auth/google/callback?code=codigo&state=x.escritorio-${sufijo}`,
			);
			expect(res.headers.get("location") ?? "").not.toContain("127.0.0.1");
		}
	});
});
