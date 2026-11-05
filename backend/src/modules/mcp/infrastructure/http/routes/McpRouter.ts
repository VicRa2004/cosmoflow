import { OpenAPIHono, z } from "@hono/zod-openapi";
import type { MiddlewareHandler } from "hono";
import {
	errorResponse,
	jsonResponse,
} from "@/core/shared/infrastructure/http/openapi";
import type { AuthMiddleware } from "@/modules/auth";
import type { McpController } from "../controllers/McpController";
import type { OAuthController } from "../controllers/OAuthController";
import {
	autorizarConexionSchema,
	conexionAutorizadaSchema,
	consultaConexionSchema,
	destinoConexionSchema,
	registroClienteSchema,
} from "../schemas/oauthSchemas";

const tags = ["Conector MCP"];
const security = [{ bearerAuth: [] }];
const metadatos = z.record(z.string(), z.unknown());

/** Se monta en `/mcp`. */
export class McpRouter {
	public readonly router = new OpenAPIHono();

	constructor(
		authMiddleware: AuthMiddleware,
		controller: McpController,
		appUrl: string,
	) {
		const docs = this.router.openAPIRegistry;
		// Este 401 es lo que hace que el cliente descubra OAuth y empiece el inicio de sesión.
		const conDescubrimiento: MiddlewareHandler = async (c, next) => {
			await next();
			if (c.res.status === 401) {
				c.res.headers.set(
					"WWW-Authenticate",
					`Bearer resource_metadata="${appUrl}/.well-known/oauth-protected-resource"`,
				);
			}
		};
		this.router.use(conDescubrimiento, authMiddleware.handle);

		docs.registerPath({
			method: "post",
			path: "/",
			tags,
			security,
			summary: "Servidor MCP (Streamable HTTP, JSON-RPC)",
			responses: {
				200: { description: "Respuesta JSON-RPC" },
				401: errorResponse("Sin token; indica cómo obtenerlo por OAuth"),
			},
		});
		this.router.post("/", controller.ejecutar);
		this.router.on(["GET", "DELETE"], "/", controller.noAdmitido);
	}
}

/** Se monta en `/.well-known`. */
export class DescubrimientoRouter {
	public readonly router = new OpenAPIHono();

	constructor(controller: OAuthController) {
		const docs = this.router.openAPIRegistry;

		docs.registerPath({
			method: "get",
			path: "/oauth-protected-resource",
			tags,
			summary: "Metadatos del recurso protegido (RFC 9728)",
			responses: { 200: jsonResponse(metadatos, "Metadatos") },
		});
		this.router.get("/oauth-protected-resource", controller.metadatosRecurso);
		// Los clientes prueban primero la ruta con el path del recurso.
		this.router.get(
			"/oauth-protected-resource/mcp",
			controller.metadatosRecurso,
		);

		docs.registerPath({
			method: "get",
			path: "/oauth-authorization-server",
			tags,
			summary: "Metadatos del servidor de autorización (RFC 8414)",
			responses: { 200: jsonResponse(metadatos, "Metadatos") },
		});
		this.router.get(
			"/oauth-authorization-server",
			controller.metadatosServidor,
		);
	}
}

/** Se monta en `/api/oauth`. */
export class OAuthRouter {
	public readonly router = new OpenAPIHono();

	constructor(authMiddleware: AuthMiddleware, controller: OAuthController) {
		const docs = this.router.openAPIRegistry;
		const sesion = [authMiddleware.handle, authMiddleware.soloSesion] as const;

		docs.registerPath({
			method: "post",
			path: "/registro",
			tags,
			summary: "Registro dinámico de clientes (RFC 7591)",
			request: {
				body: {
					required: true,
					content: { "application/json": { schema: registroClienteSchema } },
				},
			},
			responses: {
				201: jsonResponse(metadatos, "Cliente registrado"),
				400: errorResponse("Destino no permitido"),
			},
		});
		this.router.post("/registro", controller.registrar);

		docs.registerPath({
			method: "post",
			path: "/token",
			tags,
			summary: "Canjear el código por un token (RFC 6749, formulario)",
			responses: {
				200: jsonResponse(metadatos, "Token de acceso"),
				400: jsonResponse(metadatos, "Error OAuth"),
			},
		});
		this.router.post("/token", controller.token);

		docs.registerPath({
			method: "get",
			path: "/conexion",
			tags,
			security,
			summary: "Quién recibiría el permiso, para mostrarlo al usuario",
			request: { query: consultaConexionSchema },
			responses: {
				200: jsonResponse(destinoConexionSchema, "Destino"),
				400: errorResponse("Destino no permitido"),
				401: errorResponse("No autenticado"),
				403: errorResponse("Solo con sesión, no con un token personal"),
			},
		});
		this.router.get("/conexion", ...sesion, controller.obtenerDestino);

		docs.registerPath({
			method: "post",
			path: "/conexion",
			tags,
			security,
			summary: "Dar permiso: emite el código y devuelve adónde redirigir",
			request: {
				body: {
					required: true,
					content: { "application/json": { schema: autorizarConexionSchema } },
				},
			},
			responses: {
				200: jsonResponse(conexionAutorizadaSchema, "Permiso concedido"),
				400: errorResponse("Datos inválidos o destino no permitido"),
				401: errorResponse("No autenticado"),
				403: errorResponse("Solo con sesión, no con un token personal"),
			},
		});
		this.router.post("/conexion", ...sesion, controller.autorizar);
	}
}
