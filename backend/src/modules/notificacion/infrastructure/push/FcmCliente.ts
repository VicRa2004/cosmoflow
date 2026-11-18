import { createSign } from "node:crypto";
import type {
	ClientePush,
	MensajePush,
	ResultadoEnvioPush,
} from "../../domain/ClientePush";

const TOKEN_URL = "https://oauth2.googleapis.com/token";
const SCOPE_FCM = "https://www.googleapis.com/auth/firebase.messaging";
const GRANT_TYPE_JWT = "urn:ietf:params:oauth:grant-type:jwt-bearer";
/** Margen antes de la caducidad del access token para renovarlo sin race conditions. */
const MARGEN_RENOVACION_MS = 60_000;

interface FcmErrorPayload {
	error?: {
		status?: string;
		message?: string;
		details?: Array<{ errorCode?: string }>;
	};
}

const toBase64Url = (input: string | Buffer): string =>
	Buffer.from(input)
		.toString("base64")
		.replace(/\+/g, "-")
		.replace(/\//g, "_")
		.replace(/=+$/g, "");

/** Determina si la respuesta de error de FCM v1 indica que el token ya no es válido. */
function esTokenInvalido(status: number, body: FcmErrorPayload): boolean {
	if (status === 404) return true;
	const detalles = body.error?.details ?? [];
	if (detalles.some((d) => d.errorCode === "UNREGISTERED")) return true;
	if (
		status === 400 &&
		body.error?.status === "INVALID_ARGUMENT" &&
		typeof body.error.message === "string" &&
		body.error.message.toLowerCase().includes("registration token")
	) {
		return true;
	}
	return false;
}

/**
 * Cliente nativo de Firebase Cloud Messaging HTTP v1 (sin SDK externo).
 * Firma un JWT RS256 con la cuenta de servicio para obtener un access token OAuth2
 * y lo reutiliza en memoria hasta un minuto antes de caducar.
 */
export class FcmCliente implements ClientePush {
	private readonly privateKey: string;
	private tokenCache: { valor: string; expiraEn: number } | null = null;

	constructor(
		private readonly projectId: string,
		private readonly clientEmail: string,
		privateKey: string,
		private readonly fetchFn: typeof fetch = fetch,
	) {
		// En archivos .env las claves privadas suelen escribirse con `\n` escapados.
		this.privateKey = privateKey.replace(/\\n/g, "\n");
	}

	async enviar(
		token: string,
		mensaje: MensajePush,
	): Promise<ResultadoEnvioPush> {
		const accessToken = await this.obtenerAccessToken();
		const res = await this.fetchFn(
			`https://fcm.googleapis.com/v1/projects/${encodeURIComponent(this.projectId)}/messages:send`,
			{
				method: "POST",
				headers: {
					Authorization: `Bearer ${accessToken}`,
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					message: {
						token,
						notification: {
							title: mensaje.titulo,
							body: mensaje.cuerpo,
						},
						...(mensaje.datos ? { data: mensaje.datos } : {}),
					},
				}),
			},
		);

		if (res.ok) return "enviado";

		const payload = (await res.json().catch(() => ({}))) as FcmErrorPayload;
		if (esTokenInvalido(res.status, payload)) {
			return "token_invalido";
		}

		// Si el token OAuth caducó antes de tiempo, invalidamos caché para el siguiente intento.
		if (res.status === 401) {
			this.tokenCache = null;
		}
		throw new Error(
			`FCM respondió ${res.status}: ${payload.error?.message ?? res.statusText}`,
		);
	}

	private async obtenerAccessToken(): Promise<string> {
		const ahora = Date.now();
		if (
			this.tokenCache &&
			this.tokenCache.expiraEn - MARGEN_RENOVACION_MS > ahora
		) {
			return this.tokenCache.valor;
		}

		const assertion = this.firmarJwt(Math.floor(ahora / 1000));
		const res = await this.fetchFn(TOKEN_URL, {
			method: "POST",
			headers: { "Content-Type": "application/x-www-form-urlencoded" },
			body: new URLSearchParams({
				grant_type: GRANT_TYPE_JWT,
				assertion,
			}),
		});

		if (!res.ok) {
			throw new Error(`OAuth de FCM respondió ${res.status}`);
		}

		const data = (await res.json()) as {
			access_token?: string;
			expires_in?: number;
		};
		if (!data.access_token) {
			throw new Error("OAuth de FCM no devolvió access_token");
		}
		const expiraEn = ahora + (data.expires_in ?? 3600) * 1000;
		this.tokenCache = { valor: data.access_token, expiraEn };
		return data.access_token;
	}

	private firmarJwt(iat: number): string {
		const header = toBase64Url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
		const payload = toBase64Url(
			JSON.stringify({
				iss: this.clientEmail,
				scope: SCOPE_FCM,
				aud: TOKEN_URL,
				iat,
				exp: iat + 3600,
			}),
		);
		const contenido = `${header}.${payload}`;
		const firma = createSign("RSA-SHA256")
			.update(contenido)
			.end()
			.sign(this.privateKey);
		return `${contenido}.${toBase64Url(firma)}`;
	}
}
