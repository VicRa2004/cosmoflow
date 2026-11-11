import { beforeAll, describe, expect, it } from "bun:test";
import { api, PASSWORD, refreshCookie, vaciarUsuarios } from "@/test/e2e";

const refresh = (cookie: string) =>
	api("/api/auth/refresh", { method: "POST", cookie });

describe("Auth (e2e)", () => {
	beforeAll(vaciarUsuarios);

	it("registro → logout: el refresh token queda revocado", async () => {
		const body = { nombre: "Ana", email: "ana@e2e.dev", password: PASSWORD };

		const registro = await api("/api/auth/registro", { method: "POST", body });
		expect(registro.status).toBe(201);
		expect((await registro.json()).usuario.email).toBe("ana@e2e.dev");

		const duplicado = await api("/api/auth/registro", {
			method: "POST",
			body,
		});
		expect(duplicado.status).toBe(400);

		const cookie = refreshCookie(registro);
		const logout = await api("/api/auth/logout", { method: "POST", cookie });
		expect(logout.status).toBe(200);
		expect((await refresh(cookie)).status).toBe(401);
	});

	it("login → refresh rota el token y reutilizar el viejo revoca la sesión", async () => {
		const login = await api("/api/auth/login", {
			method: "POST",
			body: { email: "ana@e2e.dev", password: PASSWORD },
		});
		expect(login.status).toBe(200);
		const cookieVieja = refreshCookie(login);

		const rotado = await refresh(cookieVieja);
		expect(rotado.status).toBe(200);
		const sesion = await rotado.json();
		expect(sesion.accessToken).toBeString();
		expect(sesion.usuario.email).toBe("ana@e2e.dev");
		const cookieNueva = refreshCookie(rotado);

		expect((await refresh(cookieVieja)).status).toBe(401);
		expect((await refresh(cookieNueva)).status).toBe(401);
	});

	it("móvil: el refresh token viaja en cuerpo y cabecera, nunca en cookie", async () => {
		const movil = { "X-Client-Platform": "mobile" };
		const login = await api("/api/auth/login", {
			method: "POST",
			body: { email: "ana@e2e.dev", password: PASSWORD },
			headers: movil,
		});
		expect(login.status).toBe(200);
		expect(login.headers.getSetCookie()).toEqual([]);
		const { refreshToken } = await login.json();
		expect(refreshToken).toBeString();

		const rotado = await api("/api/auth/refresh", {
			method: "POST",
			headers: { ...movil, "X-Refresh-Token": refreshToken },
		});
		expect(rotado.status).toBe(200);
		const nuevo = (await rotado.json()).refreshToken;
		expect(nuevo).toBeString();
		expect(nuevo).not.toBe(refreshToken);

		const logout = await api("/api/auth/logout", {
			method: "POST",
			headers: { ...movil, "X-Refresh-Token": nuevo },
		});
		expect(logout.status).toBe(200);
		expect(
			(
				await api("/api/auth/refresh", {
					method: "POST",
					headers: { ...movil, "X-Refresh-Token": nuevo },
				})
			).status,
		).toBe(401);
	});

	it("navegador con cookie: la cabecera móvil no expone el token en el cuerpo", async () => {
		const login = await api("/api/auth/login", {
			method: "POST",
			body: { email: "ana@e2e.dev", password: PASSWORD },
		});
		const rotado = await api("/api/auth/refresh", {
			method: "POST",
			cookie: refreshCookie(login),
			headers: { "X-Client-Platform": "mobile" },
		});

		expect(rotado.status).toBe(200);
		expect((await rotado.json()).refreshToken).toBeUndefined();
		expect(refreshCookie(rotado)).toStartWith("refresh_token=");
	});

	it("vuelta de Google sin la cookie de state → login con error", async () => {
		const res = await api("/api/auth/google/callback?code=x&state=y");

		expect(res.status).toBe(302);
		expect(res.headers.get("location")).toEndWith("/login?error=google");
	});

	it("vuelta de Google con state móvil sin cookie → HTML con enlace cosmoflow://login-callback?error=google", async () => {
		const res = await api("/api/auth/google/callback?code=x&state=y.movil");

		expect(res.status).toBe(200);
		const html = await res.text();
		expect(html).toContain("cosmoflow://login-callback?error=google");
	});

	it("login con contraseña incorrecta → 401", async () => {
		const res = await api("/api/auth/login", {
			method: "POST",
			body: { email: "ana@e2e.dev", password: "incorrecta" },
		});

		expect(res.status).toBe(401);
	});
});
