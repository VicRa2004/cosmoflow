import { randomUUID } from "node:crypto";
import type { Context } from "hono";
import { BaseController } from "@/core/shared/infrastructure/http/base.controller";
import { validate } from "@/core/shared/infrastructure/libs/validate";
import type { AuthEnv } from "@/modules/auth";
import type { AutorizarConexionUseCase } from "../../../application/useCases/AutorizarConexionUseCase";
import type { CanjearCodigoUseCase } from "../../../application/useCases/CanjearCodigoUseCase";
import { ErrorOAuth } from "../../../domain/ErrorOAuth";
import { resolverDestino } from "../../../domain/destinoConexion";
import {
	autorizarConexionSchema,
	consultaConexionSchema,
	registroClienteSchema,
	tokenOAuthSchema,
} from "../schemas/oauthSchemas";

/** Rutas públicas de OAuth 2.1 (registro y token) y las que usa la pantalla de permiso. */
export class OAuthController extends BaseController {
	constructor(
		private readonly appUrl: string,
		private readonly useCases: {
			autorizar: AutorizarConexionUseCase;
			canjear: CanjearCodigoUseCase;
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
			grant_types_supported: ["authorization_code"],
			code_challenge_methods_supported: ["S256"],
			token_endpoint_auth_methods_supported: ["none"],
		});

	/** RFC 7591. No se guarda nada: lo que protege es la lista de `destinoConexion`. */
	registrar = (c: Context): Promise<Response> =>
		this.executeSafely(c, async () => {
			const { redirect_uris, client_name } = validate(
				registroClienteSchema,
				await c.req.json(),
			);
			if (!redirect_uris.every(resolverDestino)) {
				throw new ErrorOAuth("invalid_redirect_uri", "Destino no permitido");
			}
			return this.created(c, {
				client_id: randomUUID(),
				client_name,
				redirect_uris,
				grant_types: ["authorization_code"],
				response_types: ["code"],
				token_endpoint_auth_method: "none",
			});
		});

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
			if (form.grant_type !== "authorization_code") {
				throw new ErrorOAuth("unsupported_grant_type", "Tipo no admitido");
			}
			const datos = tokenOAuthSchema.safeParse(form);
			if (!datos.success) {
				throw new ErrorOAuth(
					"invalid_request",
					"Faltan datos o no son válidos",
				);
			}
			const accessToken = await this.useCases.canjear.ejecutar({
				code: datos.data.code,
				redirectUri: datos.data.redirect_uri,
				clientId: datos.data.client_id,
				codeVerifier: datos.data.code_verifier,
			});
			return c.json({ access_token: accessToken, token_type: "Bearer" });
		} catch (error) {
			if (error instanceof ErrorOAuth) {
				return c.json(
					{ error: error.codigo, error_description: error.message },
					400,
				);
			}
			throw error;
		}
	};
}
