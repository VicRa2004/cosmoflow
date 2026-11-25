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

// App de escritorio: redirección a loopback (RFC 8252) con `?escritorio=<puerto>-<nonce>`.
// El nonce es la ruta donde escucha la app: otra web no puede colarle una sesión ajena.
const ESCRITORIO = /^(\d{4,5})-([a-f0-9]{32})$/;

/** URL de vuelta a la app de escritorio si el state la pide, o `null`. */
function vueltaEscritorio(state: string | undefined): string | null {
	const sufijo = state?.split(".escritorio-")[1];
	const m = sufijo ? ESCRITORIO.exec(sufijo) : null;
	if (!m) return null;
	const puerto = Number(m[1]);
	if (puerto < 1024 || puerto > 65535) return null;
	return `http://127.0.0.1:${puerto}/${m[2]}`;
}

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
		const esMovil =
			c.req.query("movil") === "1" || c.req.query("plataforma") === "mobile";
		const escritorio = c.req.query("escritorio") ?? "";
		const sufijo = ESCRITORIO.test(escritorio)
			? `.escritorio-${escritorio}`
			: esMovil
				? ".movil"
				: "";
		if (!this.deps) {
			return this.volverConError(c, esMovil, vueltaEscritorio(sufijo));
		}

		const state = `${randomBytes(16).toString("hex")}${sufijo}`;
		const codeVerifier = randomBytes(32).toString("base64url");
		setCookie(c, COOKIE_OAUTH, `${state}.${codeVerifier}`, {
			...opcionesCookie,
			maxAge: 10 * 60,
		});
		return c.redirect(this.deps.google.urlAutorizacion(state, codeVerifier));
	};

	callback = async (c: Context): Promise<Response> => {
		// Corta por el último punto: el state móvil también lleva uno (`<hex>.movil`).
		const cookie = getCookie(c, COOKIE_OAUTH) ?? "";
		const corte = cookie.lastIndexOf(".");
		const state = cookie.slice(0, Math.max(corte, 0));
		const codeVerifier = cookie.slice(corte + 1);
		deleteCookie(c, COOKIE_OAUTH, opcionesCookie);

		const code = c.req.query("code");
		const stateQuery = c.req.query("state");
		const esMovil = Boolean(
			state?.endsWith(".movil") || stateQuery?.endsWith(".movil"),
		);
		const escritorio = vueltaEscritorio(state || stateQuery);
		// El state ata la respuesta a este navegador (CSRF en el login).
		const valido = code && state && codeVerifier && stateQuery === state;
		if (!this.deps || !valido) {
			return this.volverConError(c, esMovil, escritorio);
		}

		try {
			const { refreshToken } = await this.deps.loginGoogle.ejecutar({
				code,
				codeVerifier,
			});
			if (escritorio) {
				return c.redirect(
					`${escritorio}?refreshToken=${encodeURIComponent(refreshToken)}`,
				);
			}
			if (esMovil) {
				return this.responderMovil(
					c,
					`cosmoflow://login-callback?refreshToken=${encodeURIComponent(refreshToken)}`,
					"¡Sesión iniciada con éxito!",
					"Volviendo a Cosmoflow...",
				);
			}
			setRefreshTokenCookie(c, refreshToken);
			// La SPA canjea la cookie por el access token con /api/auth/refresh.
			return c.redirect(`${env.APP_URL}/login/google`);
		} catch (error) {
			log.warn("Login con Google fallido", { error: String(error) });
			return this.volverConError(c, esMovil, escritorio);
		}
	};

	private volverConError(
		c: Context,
		esMovil = false,
		escritorio: string | null = null,
	): Response {
		if (escritorio) return c.redirect(`${escritorio}?error=google`);
		if (esMovil) {
			return this.responderMovil(
				c,
				"cosmoflow://login-callback?error=google",
				"Error al iniciar sesión",
				"No se pudo completar el inicio de sesión con Google.",
				true,
			);
		}
		return c.redirect(`${env.APP_URL}/login?error=google`);
	}

	private responderMovil(
		c: Context,
		urlDestino: string,
		titulo: string,
		mensaje: string,
		isError = false,
	): Response {
		const colorTitulo = isError ? "#f43f5e" : "#f8fafc";
		const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <title>${titulo}</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta http-equiv="refresh" content="0;url=${urlDestino}">
  <script>
    window.location.href = ${JSON.stringify(urlDestino)};
  </script>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; text-align: center; padding: 40px 20px; background: #0b0f19; color: #f8fafc;">
  <h2 style="margin-bottom: 12px; font-size: 20px; color: ${colorTitulo};">${titulo}</h2>
  <p style="color: #94a3b8; font-size: 14px; margin-bottom: 24px;">${mensaje}</p>
  <a href="${urlDestino}" style="display: inline-block; background: #4f46e5; color: white; padding: 10px 20px; border-radius: 8px; text-decoration: none; font-weight: 500; font-size: 14px;">Volver a la app</a>
</body>
</html>`;
		return c.html(html);
	}
}
