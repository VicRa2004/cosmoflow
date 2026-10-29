import { randomBytes } from "node:crypto";
import type { Context } from "hono";
import { deleteCookie, getCookie, setCookie } from "hono/cookie";
import { env } from "@/core/config/env";
import { BaseController } from "@/core/shared/infrastructure/http/base.controller";
import { log } from "@/core/shared/infrastructure/logger";
import type { LoginGoogleUseCase } from "../../../application/useCases/LoginGoogleUseCase";
import type { ProveedorGoogle } from "../../../domain/service/ProveedorGoogle";
import { setRefreshTokenCookie } from "../refreshTokenCookie";

const COOKIE_OAUTH = "google_oauth";

// Lax (no Strict): el callback llega navegando desde Google y la cookie debe viajar.
const opcionesCookie = {
	httpOnly: true,
	secure: env.NODE_ENV === "prod",
	sameSite: "Lax",
	path: "/api/auth/google",
} as const;

/**
 * Las dos rutas son navegaciones del navegador, no llamadas de la SPA: los
 * errores redirigen al login en vez de responder JSON (sin `executeSafely`).
 */
export class GoogleController extends BaseController {
	constructor(
		/** `null` si faltan GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET. */
		private readonly deps: {
			google: ProveedorGoogle;
			loginGoogle: LoginGoogleUseCase;
		} | null,
	) {
		super();
	}

	iniciar = async (c: Context): Promise<Response> => {
		if (!this.deps) return this.volverConError(c);

		const state = randomBytes(16).toString("hex");
		const codeVerifier = randomBytes(32).toString("base64url");
		setCookie(c, COOKIE_OAUTH, `${state}.${codeVerifier}`, {
			...opcionesCookie,
			maxAge: 10 * 60,
		});
		return c.redirect(this.deps.google.urlAutorizacion(state, codeVerifier));
	};

	callback = async (c: Context): Promise<Response> => {
		const [state, codeVerifier] = (getCookie(c, COOKIE_OAUTH) ?? "").split(".");
		deleteCookie(c, COOKIE_OAUTH, opcionesCookie);

		const code = c.req.query("code");
		// El state ata la respuesta a este navegador (CSRF en el login).
		const valido =
			code && state && codeVerifier && c.req.query("state") === state;
		if (!this.deps || !valido) {
			return this.volverConError(c);
		}

		try {
			const { refreshToken } = await this.deps.loginGoogle.ejecutar({
				code,
				codeVerifier,
			});
			setRefreshTokenCookie(c, refreshToken);
			// La SPA canjea la cookie por el access token con /api/auth/refresh.
			return c.redirect(`${env.APP_URL}/login/google`);
		} catch (error) {
			log.warn("Login con Google fallido", { error: String(error) });
			return this.volverConError(c);
		}
	};

	private volverConError(c: Context): Response {
		return c.redirect(`${env.APP_URL}/login?error=google`);
	}
}
