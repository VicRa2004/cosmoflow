import { afterEach, describe, expect, it, spyOn } from "bun:test";
import { GoogleOAuthService } from "./GoogleOAuthService";

const servicio = new GoogleOAuthService("cliente", "secreto", "http://app/cb");

const claimsValidas = {
	iss: "https://accounts.google.com",
	aud: "cliente",
	exp: Math.floor(Date.now() / 1000) + 3600,
	sub: "g-1",
	email: "ana@x.com",
	email_verified: true,
	name: "Ana",
};

const idToken = (claims: object) =>
	`h.${Buffer.from(JSON.stringify(claims)).toString("base64url")}.firma`;

const responderGoogle = (claims: object) =>
	spyOn(globalThis, "fetch").mockResolvedValue(
		Response.json({ id_token: idToken(claims) }),
	);

describe("GoogleOAuthService", () => {
	afterEach(() => {
		(
			globalThis.fetch as unknown as { mockRestore?: () => void }
		).mockRestore?.();
	});

	it("la URL lleva el state y el challenge S256 del verifier", () => {
		const url = new URL(servicio.urlAutorizacion("st", "verifier"));

		expect(url.searchParams.get("state")).toBe("st");
		expect(url.searchParams.get("code_challenge_method")).toBe("S256");
		// RFC 7636, apéndice B: SHA-256 en base64url de "verifier"
		expect(url.searchParams.get("code_challenge")).toBe(
			new Bun.CryptoHasher("sha256").update("verifier").digest("base64url"),
		);
	});

	it("devuelve el perfil con claims válidas", async () => {
		responderGoogle(claimsValidas);

		expect(await servicio.obtenerPerfil("code", "v")).toEqual({
			googleId: "g-1",
			email: "ana@x.com",
			nombre: "Ana",
		});
	});

	it.each([
		["otro cliente", { aud: "otro" }],
		["caducado", { exp: 1 }],
		["email sin verificar", { email_verified: false }],
		["otro emisor", { iss: "https://evil.com" }],
	])("rechaza un id_token de %s", async (_, cambio) => {
		responderGoogle({ ...claimsValidas, ...cambio });

		await expect(servicio.obtenerPerfil("code", "v")).rejects.toMatchObject({
			code: 401,
		});
	});

	it("rechaza si Google responde con error", async () => {
		spyOn(globalThis, "fetch").mockResolvedValue(
			new Response("", { status: 400 }),
		);

		await expect(servicio.obtenerPerfil("code", "v")).rejects.toMatchObject({
			code: 401,
		});
	});
});
