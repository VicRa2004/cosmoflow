/**
 * shortcut: solo Claude/Gemini en la web y apps locales; el registro de OAuth es abierto, así que
 * esta lista es lo que impide que una web ajena reciba un código. Otro cliente web: añadirlo aquí.
 */
const CALLBACKS_WEB: Record<string, string> = {
	"https://claude.ai/api/mcp/auth_callback": "Claude",
	"https://claude.com/api/mcp/auth_callback": "Claude",
};

/**
 * Gemini (Connected Apps de Google): `/r/<proyecto>` o `/a/<proyecto>` según el proyecto de Google.
 * shortcut: solo el host de producción; añadir `-sandbox`/`-test` si se registra en Connected Console.
 */
const CALLBACK_GEMINI =
	/^https:\/\/oauth-redirect\.googleusercontent\.com\/[ra]\/[A-Za-z0-9._-]+$/;

export const NOMBRE_GEMINI = "Gemini";

export interface DestinoConexion {
	nombre: string;
	/** Dominio al que irá el código; se muestra en la pantalla de permiso. */
	host: string;
	/** Una app de este dispositivo: cualquier proceso local podría hacerse pasar por ella. */
	esLocal: boolean;
}

/** `null` si no es un destino permitido. En local vale cualquier puerto (RFC 8252). */
export function resolverDestino(redirectUri: string): DestinoConexion | null {
	const nombre = CALLBACKS_WEB[redirectUri];
	if (nombre) {
		return { nombre, host: new URL(redirectUri).hostname, esLocal: false };
	}
	if (CALLBACK_GEMINI.test(redirectUri)) {
		return {
			nombre: NOMBRE_GEMINI,
			host: "oauth-redirect.googleusercontent.com",
			esLocal: false,
		};
	}

	if (!URL.canParse(redirectUri)) return null;
	const { protocol, hostname, username, password, hash } = new URL(redirectUri);
	const esLoopback =
		protocol === "http:" &&
		(hostname === "localhost" || hostname === "127.0.0.1") &&
		!username &&
		!password &&
		!hash;
	return esLoopback
		? {
				nombre: "Una aplicación de este dispositivo",
				host: hostname,
				esLocal: true,
			}
		: null;
}
