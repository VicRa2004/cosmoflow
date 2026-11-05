import { z } from "@hono/zod-openapi";

const clientId = z.string().min(1).max(255);
const redirectUri = z.string().min(1).max(2048);

export const consultaConexionSchema = z.object({
	redirect_uri: redirectUri,
});

export const destinoConexionSchema = z
	.object({
		nombre: z.string().openapi({ example: "Claude" }),
		host: z.string().openapi({ example: "claude.ai" }),
		esLocal: z.boolean(),
	})
	.openapi("DestinoConexion");

export const autorizarConexionSchema = z.object({
	clientId,
	redirectUri,
	// S256: base64url de 32 bytes. El método no viaja: es el único admitido.
	codeChallenge: z
		.string()
		.regex(/^[A-Za-z0-9_-]{43}$/, "code_challenge inválido"),
	state: z.string().max(2048).optional(),
});

export const conexionAutorizadaSchema = z
	.object({ redirectUri: z.string() })
	.openapi("ConexionAutorizada");

export const registroClienteSchema = z.object({
	redirect_uris: z.array(redirectUri).min(1).max(10),
	client_name: z.string().max(255).optional(),
});

export const tokenOAuthSchema = z.object({
	grant_type: z.string(),
	code: z.string().min(1).max(256),
	redirect_uri: redirectUri,
	client_id: clientId,
	code_verifier: z.string().min(43).max(128),
});
