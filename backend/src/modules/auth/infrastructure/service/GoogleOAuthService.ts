import { createHash } from "node:crypto";
import { z } from "zod";
import { BaseError } from "@/core/shared/domain/error/BaseError";
import type {
	PerfilGoogle,
	ProveedorGoogle,
} from "../../domain/service/ProveedorGoogle";

const URL_AUTORIZACION = "https://accounts.google.com/o/oauth2/v2/auth";
const URL_TOKEN = "https://oauth2.googleapis.com/token";

const claimsSchema = z.object({
	iss: z.enum(["https://accounts.google.com", "accounts.google.com"]),
	aud: z.string(),
	exp: z.number(),
	sub: z.string().min(1),
	email: z.email(),
	email_verified: z.literal(true),
	name: z.string().optional(),
});

export class GoogleOAuthService implements ProveedorGoogle {
	constructor(
		private readonly clientId: string,
		private readonly clientSecret: string,
		private readonly redirectUri: string,
	) {}

	urlAutorizacion(state: string, codeVerifier: string): string {
		const params = new URLSearchParams({
			client_id: this.clientId,
			redirect_uri: this.redirectUri,
			response_type: "code",
			scope: "openid email profile",
			state,
			code_challenge: createHash("sha256")
				.update(codeVerifier)
				.digest("base64url"),
			code_challenge_method: "S256",
			prompt: "select_account",
		});
		return `${URL_AUTORIZACION}?${params}`;
	}

	async obtenerPerfil(
		code: string,
		codeVerifier: string,
	): Promise<PerfilGoogle> {
		const respuesta = await fetch(URL_TOKEN, {
			method: "POST",
			body: new URLSearchParams({
				grant_type: "authorization_code",
				code,
				code_verifier: codeVerifier,
				client_id: this.clientId,
				client_secret: this.clientSecret,
				redirect_uri: this.redirectUri,
			}),
		});
		if (!respuesta.ok) {
			throw new BaseError("Google rechazó el inicio de sesión", 401);
		}
		const { id_token } = (await respuesta.json()) as { id_token?: string };
		return this.leerPerfil(id_token);
	}

	// El id_token llega directo de Google por TLS y autenticado con el secreto:
	// basta con validar las claims, sin comprobar la firma (OIDC Core 3.1.3.7).
	private leerPerfil(idToken: string | undefined): PerfilGoogle {
		let claims: z.infer<typeof claimsSchema>;
		try {
			const payload = idToken?.split(".")[1] ?? "";
			claims = claimsSchema.parse(
				JSON.parse(Buffer.from(payload, "base64url").toString()),
			);
		} catch {
			throw new BaseError("Respuesta de Google inválida", 401);
		}
		if (claims.aud !== this.clientId || claims.exp * 1000 < Date.now()) {
			throw new BaseError("Respuesta de Google inválida", 401);
		}
		return {
			googleId: claims.sub,
			email: claims.email,
			nombre: claims.name || claims.email.slice(0, claims.email.indexOf("@")),
		};
	}
}
