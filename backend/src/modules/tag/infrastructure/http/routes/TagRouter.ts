import { OpenAPIHono } from "@hono/zod-openapi";
import {
	errorResponse,
	jsonResponse,
	protectedErrorResponses,
} from "@/core/shared/infrastructure/http/openapi";
import type { AuthMiddleware } from "@/modules/auth";
import type { PermisoGuard } from "@/core/shared/infrastructure/http/permisoGuard";
import { TagController } from "../controllers/TagController";
import {
	actualizarTagSchema,
	crearTagSchema,
	obtenerTagsSchema,
	tagDtoSchema,
	tagIdSchema,
	tagPaginaSchema,
} from "../schemas/tagSchemas";

const tags = ["Tags"];
const security = [{ bearerAuth: [] }];
const recurso = "tags";

export class TagRouter {
	public readonly router = new OpenAPIHono();

	constructor(
		authMiddleware: AuthMiddleware,
		guard: PermisoGuard,
		controller: TagController,
	) {
		const docs = this.router.openAPIRegistry;
		this.router.use(authMiddleware.handle);

		docs.registerPath({
			method: "post",
			path: "/",
			tags,
			security,
			summary: "Crear tag",
			request: {
				body: {
					required: true,
					content: { "application/json": { schema: crearTagSchema } },
				},
			},
			responses: {
				201: jsonResponse(tagDtoSchema, "Tag creado"),
				400: errorResponse("Validación fallida"),
				...protectedErrorResponses(`${recurso}:crear`),
				409: errorResponse("Ya tienes un tag con ese nombre"),
			},
		});
		this.router.post("/", guard.handle(recurso, "crear"), controller.crear);

		docs.registerPath({
			method: "get",
			path: "/",
			tags,
			security,
			summary: "Listar tags (paginado)",
			request: { query: obtenerTagsSchema },
			responses: {
				200: jsonResponse(tagPaginaSchema, "Lista paginada"),
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
			summary: "Obtener tag por ID",
			request: { params: tagIdSchema },
			responses: {
				200: jsonResponse(tagDtoSchema, "Tag encontrado"),
				...protectedErrorResponses(`${recurso}:leer`),
				404: errorResponse("Tag no encontrado"),
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
			summary: "Actualizar tag",
			request: {
				params: tagIdSchema,
				body: {
					required: true,
					content: { "application/json": { schema: actualizarTagSchema } },
				},
			},
			responses: {
				200: jsonResponse(tagDtoSchema, "Tag actualizado"),
				400: errorResponse("Validación fallida"),
				...protectedErrorResponses(`${recurso}:actualizar`),
				404: errorResponse("Tag no encontrado"),
				409: errorResponse("Ya tienes un tag con ese nombre"),
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
			summary: "Eliminar tag",
			request: { params: tagIdSchema },
			responses: {
				204: { description: "Tag eliminado" },
				...protectedErrorResponses(`${recurso}:eliminar`),
				404: errorResponse("Tag no encontrado"),
			},
		});
		this.router.delete(
			"/:id",
			guard.handle(recurso, "eliminar"),
			controller.eliminar,
		);
	}
}
