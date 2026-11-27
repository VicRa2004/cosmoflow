import { randomUUID } from "node:crypto";
import type { Context } from "hono";
import { BaseController } from "@/core/shared/infrastructure/http/base.controller";
import { validate } from "@/core/shared/infrastructure/libs/validate";
import type { AuthEnv } from "@/modules/auth";
import type { AutorizarConexionUseCase } from "../../../application/useCases/AutorizarConexionUseCase";
import type {
	CanjearCodigoUseCase,
	TokensOAuth,
} from "../../../application/useCases/CanjearCodigoUseCase";
import { ErrorOAuth } from "../../../domain/ErrorOAuth";
import { resolverDestino } from "../../../domain/destinoConexion";
import {
	autorizarConexionSchema,
	consultaConexionSchema,
	registroClienteSchema,
	renovarTokenOAuthSchema,
	tokenOAuthSchema,
} from "../schemas/oauthSchemas";

/** RFC 6749/7591: los clientes OAuth leen `error`, no el formato de la API. */
const errorOAuth = (c: Context, error: string, descripcion: string) =>
	c.json({ error, error_description: descripcion }, 400);

const datosInvalidos = () =>
	new ErrorOAuth("invalid_request", "Faltan datos o no son válidos");

/** Rutas públicas de OAuth 2.1 (registro y token) y las que usa la pantalla de permiso. */
export class OAuthController extends BaseController {
	constructor(
		private readonly appUrl: string,
		private readonly useCases: {
			autorizar: AutorizarConexionUseCase;
			canjear: CanjearCodigoUseCase;
			renovar: {
				ejecutar(
					refreshToken: string,
					clientId: string,
				): Promise<TokensOAuth | null>;
			};
		},
	) {
		super();
	}

	private get urlMcp(): string {
		return `${this.appUrl}/mcp`;
	}

	metadatosRecurso = (c: Context): Response =>
		c.json({
			resource: this.urlMcp,
			authorization_servers: [this.appUrl],
			bearer_methods_supported: ["header"],
		});

	metadatosServidor = (c: Context): Response =>
		c.json({
			issuer: this.appUrl,
			authorization_endpoint: `${this.appUrl}/autorizar-conexion`,
			token_endpoint: `${this.appUrl}/api/oauth/token`,
			registration_endpoint: `${this.appUrl}/api/oauth/registro`,
			response_types_supported: ["code"],
			grant_types_supported: ["authorization_code", "refresh_token"],
			code_challenge_methods_supported: ["S256"],
			token_endpoint_auth_methods_supported: ["none"],
			authorization_response_iss_parameter_supported: true,
			// CIMD (spec MCP 2026-07-28): el client_id puede ser una URL. No se descarga el
			// documento porque el registro tampoco se guarda: protege la lista de `destinoConexion`.
			client_id_metadata_document_supported: true,
		});

	/** RFC 7591. No se guarda nada: lo que protege es la lista de `destinoConexion`. */
	registrar = async (c: Context): Promise<Response> => {
		const datos = registroClienteSchema.safeParse(
			await c.req.json().catch(() => null),
		);
		if (!datos.success) {
			return errorOAuth(
				c,
				"invalid_client_metadata",
				"Faltan datos o no son válidos",
			);
		}
		const { redirect_uris, client_name } = datos.data;
		if (!redirect_uris.every(resolverDestino)) {
			return errorOAuth(c, "invalid_redirect_uri", "Destino no permitido");
		}
		return c.json(
			{
				client_id: randomUUID(),
				client_id_issued_at: Math.floor(Date.now() / 1000),
				client_name,
				redirect_uris,
				grant_types: ["authorization_code", "refresh_token"],
				response_types: ["code"],
				token_endpoint_auth_method: "none",
			},
			201,
		);
	};

	obtenerDestino = (c: Context<AuthEnv>): Promise<Response> =>
		this.executeSafely(c, async () => {
			const { redirect_uri } = validate(consultaConexionSchema, c.req.query());
			const destino = resolverDestino(redirect_uri);
			if (!destino) {
				throw new ErrorOAuth("invalid_redirect_uri", "Destino no permitido");
			}
			return this.ok(c, destino);
		});

	autorizar = (c: Context<AuthEnv>): Promise<Response> =>
		this.executeSafely(c, async () => {
			const dto = validate(autorizarConexionSchema, await c.req.json());
			const redirectUri = await this.useCases.autorizar.ejecutar(
				c.get("usuario").id,
				dto,
			);
			return this.ok(c, { redirectUri });
		});

	/** RFC 6749: cuerpo de formulario y errores con `error`, no con el formato de la API. */
	token = async (c: Context): Promise<Response> => {
		c.header("Cache-Control", "no-store");
		try {
			const form = Object.fromEntries(new URLSearchParams(await c.req.text()));
			const tokens =
				form.grant_type === "authorization_code"
					? await this.canjearCodigo(form)
					: form.grant_type === "refresh_token"
						? await this.renovar(form)
						: null;
			if (!tokens) {
				throw new ErrorOAuth("unsupported_grant_type", "Tipo no admitido");
			}
			return c.json({
				access_token: tokens.accessToken,
				token_type: "Bearer",
				expires_in: tokens.expiraEnSegundos,
				refresh_token: tokens.refreshToken,
			});
		} catch (error) {
			if (error instanceof ErrorOAuth) {
				return errorOAuth(c, error.codigo, error.message);
			}
			throw error;
		}
	};

	private canjearCodigo(form: Record<string, string>): Promise<TokensOAuth> {
		const datos = tokenOAuthSchema.safeParse(form);
		if (!datos.success) throw datosInvalidos();
		return this.useCases.canjear.ejecutar({
			code: datos.data.code,
			redirectUri: datos.data.redirect_uri,
			clientId: datos.data.client_id,
			codeVerifier: datos.data.code_verifier,
		});
	}

	private async renovar(form: Record<string, string>): Promise<TokensOAuth> {
		const datos = renovarTokenOAuthSchema.safeParse(form);
		if (!datos.success) throw datosInvalidos();
		const tokens = await this.useCases.renovar.ejecutar(
			datos.data.refresh_token,
			datos.data.client_id,
		);
		if (!tokens) {
			throw new ErrorOAuth(
				"invalid_grant",
				"Refresh token inválido, revocado o ya usado",
			);
		}
		return tokens;
	}
}
