import type { Context } from "hono";
import { deleteCookie, getCookie, setCookie } from "hono/cookie";
import { env } from "@/core/config/env";

const NOMBRE_COOKIE = "refresh_token";
/** Cabecera con la que la app móvil envía su refresh token (no maneja cookies). */
const CABECERA_REFRESH_TOKEN = "X-Refresh-Token";

// Sólo viaja a las rutas de auth y nunca es legible desde JavaScript (XSS).
const opcionesCookie = {
	httpOnly: true,
	secure: env.NODE_ENV === "prod",
	sameSite: "Strict",
	path: "/api/auth",
} as const;

/**
 * Cliente móvil: `X-Client-Platform: mobile`. Si además llega la cookie es un
 * navegador, y a un navegador nunca se le entrega el token en el cuerpo (XSS).
 */
function esClienteMovil(c: Context): boolean {
	return (
		c.req.header("X-Client-Platform") === "mobile" &&
		!getCookie(c, NOMBRE_COOKIE)
	);
}

/** Guarda el refresh token en una cookie httpOnly (misma vida que en BD: 7 días). */
export function setRefreshTokenCookie(c: Context, refreshToken: string): void {
	setCookie(c, NOMBRE_COOKIE, refreshToken, {
		...opcionesCookie,
		maxAge: 60 * 60 * 24 * 7,
	});
}

/**
 * Web: fija la cookie y devuelve `{}`. Móvil: devuelve `{ refreshToken }`
 * para añadirlo al cuerpo de la respuesta.
 */
export function entregarRefreshToken(
	c: Context,
	refreshToken: string,
): { refreshToken?: string } {
	if (esClienteMovil(c)) return { refreshToken };
	setRefreshTokenCookie(c, refreshToken);
	return {};
}

/** De la cookie (web) o de la cabecera `X-Refresh-Token` (móvil). */
export function leerRefreshToken(c: Context): string | undefined {
	return getCookie(c, NOMBRE_COOKIE) ?? c.req.header(CABECERA_REFRESH_TOKEN);
}

export function clearRefreshTokenCookie(c: Context): void {
	deleteCookie(c, NOMBRE_COOKIE, opcionesCookie);
}
