import { OpenAPIHono } from "@hono/zod-openapi";
import {
	errorResponse,
	jsonResponse,
	protectedErrorResponses,
} from "@/core/shared/infrastructure/http/openapi";
import type { AuthMiddleware } from "@/modules/auth";
import type { PermisoGuard } from "@/core/shared/infrastructure/http/permisoGuard";
import { NotaController } from "../controllers/NotaController";
import {
	actualizarNotaSchema,
	crearNotaSchema,
	obtenerNotasSchema,
	notaDtoSchema,
	notaIdSchema,
	notaPaginaSchema,
} from "../schemas/notaSchemas";

const tags = ["Notas"];
const security = [{ bearerAuth: [] }];
const recurso = "notas";

export class NotaRouter {
	public readonly router = new OpenAPIHono();

	constructor(
		authMiddleware: AuthMiddleware,
		guard: PermisoGuard,
		controller: NotaController,
	) {
		const docs = this.router.openAPIRegistry;
		this.router.use(authMiddleware.handle);

		docs.registerPath({
			method: "post",
			path: "/",
			tags,
			security,
			summary: "Crear nota",
			request: {
				body: {
					required: true,
					content: { "application/json": { schema: crearNotaSchema } },
				},
			},
			responses: {
				201: jsonResponse(notaDtoSchema, "Nota creada"),
				400: errorResponse("Validación fallida o tags ajenos"),
				...protectedErrorResponses(`${recurso}:crear`),
			},
		});
		this.router.post("/", guard.handle(recurso, "crear"), controller.crear);

		docs.registerPath({
			method: "get",
			path: "/",
			tags,
			security,
			summary: "Listar notas (paginado)",
			request: { query: obtenerNotasSchema },
			responses: {
				200: jsonResponse(notaPaginaSchema, "Lista paginada"),
				400: errorResponse("Parámetros inválidos"),
				...protectedErrorResponses(`${recurso}:leer`),
			},
		});
		this.router.get(
			"/",
			guard.handle(recurso, "leer"),
			controller.obtenerTodos,
		);

		docs.registerPath({
			method: "get",
			path: "/{id}",
			tags,
			security,
			summary: "Obtener nota por ID",
			request: { params: notaIdSchema },
			responses: {
				200: jsonResponse(notaDtoSchema, "Nota encontrada"),
				...protectedErrorResponses(`${recurso}:leer`),
				404: errorResponse("Nota no encontrada"),
			},
		});
		this.router.get(
			"/:id",
			guard.handle(recurso, "leer"),
			controller.obtenerUno,
		);

		docs.registerPath({
			method: "put",
			path: "/{id}",
			tags,
			security,
			summary: "Actualizar nota",
			request: {
				params: notaIdSchema,
				body: {
					required: true,
					content: { "application/json": { schema: actualizarNotaSchema } },
				},
			},
			responses: {
				200: jsonResponse(notaDtoSchema, "Nota actualizada"),
				400: errorResponse("Validación fallida o tags ajenos"),
				...protectedErrorResponses(`${recurso}:actualizar`),
				404: errorResponse("Nota no encontrada"),
			},
		});
		this.router.put(
			"/:id",
			guard.handle(recurso, "actualizar"),
			controller.actualizar,
		);

		docs.registerPath({
			method: "delete",
			path: "/{id}",
			tags,
			security,
			summary: "Eliminar nota",
			request: { params: notaIdSchema },
			responses: {
				204: { description: "Nota eliminada" },
				...protectedErrorResponses(`${recurso}:eliminar`),
				404: errorResponse("Nota no encontrada"),
			},
		});
		this.router.delete(
			"/:id",
			guard.handle(recurso, "eliminar"),
			controller.eliminar,
		);
	}
}
