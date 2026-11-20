import { OpenAPIHono } from "@hono/zod-openapi";
import {
	errorResponse,
	jsonResponse,
	protectedErrorResponses,
} from "@/core/shared/infrastructure/http/openapi";
import type { PermisoGuard } from "@/core/shared/infrastructure/http/permisoGuard";
import type { AuthMiddleware } from "@/modules/auth";
import type { ComentarioTareaController } from "../controllers/ComentarioTareaController";
import {
	comentarioDtoSchema,
	comentarioIdSchema,
	comentarioPaginaSchema,
	comentarioSchema,
	listarComentariosSchema,
	tareaComentariosSchema,
} from "../schemas/comentarioSchemas";
import {
	actividadTareaSchema,
	listarActividadSchema,
} from "../schemas/actividadSchemas";

const tags = ["Comentarios e historial de tareas"];
const security = [{ bearerAuth: [] }];
const recurso = "tareas";
const cuerpo = {
	required: true,
	content: { "application/json": { schema: comentarioSchema } },
};

/** Se monta en `/api/tareas` junto a `TareaRouter`. */
export class ComentarioTareaRouter {
	public readonly router = new OpenAPIHono();

	constructor(
		authMiddleware: AuthMiddleware,
		guard: PermisoGuard,
		controller: ComentarioTareaController,
	) {
		const docs = this.router.openAPIRegistry;
		this.router.use("/:id/comentarios/*", authMiddleware.handle);
		this.router.use("/:id/comentarios", authMiddleware.handle);
		this.router.use("/:id/actividad", authMiddleware.handle);

		docs.registerPath({
			method: "get",
			path: "/{id}/actividad",
			tags,
			security,
			summary: "Historial de una tarea (lo más reciente primero)",
			description:
				"Creación, cambios de título, prioridad, fechas o estado, responsables, movimientos, papelera y comentarios. Pagina por cursor: `antesDe` = id de la última entrada recibida.",
			request: { params: tareaComentariosSchema, query: listarActividadSchema },
			responses: {
				200: jsonResponse(actividadTareaSchema, "Historial"),
				...protectedErrorResponses(`${recurso}:leer`),
				404: errorResponse("Tarea no encontrada"),
			},
		});
		this.router.get(
			"/:id/actividad",
			guard.handle(recurso, "leer"),
			controller.actividad,
		);

		docs.registerPath({
			method: "get",
			path: "/{id}/comentarios",
			tags,
			security,
			summary: "Comentarios de una tarea (los más antiguos primero)",
			request: {
				params: tareaComentariosSchema,
				query: listarComentariosSchema,
			},
			responses: {
				200: jsonResponse(comentarioPaginaSchema, "Lista paginada"),
				...protectedErrorResponses(`${recurso}:leer`),
				404: errorResponse("Tarea no encontrada"),
			},
		});
		this.router.get(
			"/:id/comentarios",
			guard.handle(recurso, "leer"),
			controller.obtenerTodos,
		);

		docs.registerPath({
			method: "post",
			path: "/{id}/comentarios",
			tags,
			security,
			summary: "Comentar una tarea",
			description:
				"Cualquiera que vea la tarea. Avisa a los mencionados y a sus responsables y creador.",
			request: { params: tareaComentariosSchema, body: cuerpo },
			responses: {
				201: jsonResponse(comentarioDtoSchema, "Comentario creado"),
				400: errorResponse("Datos inválidos"),
				...protectedErrorResponses(`${recurso}:leer`),
				404: errorResponse("Tarea no encontrada"),
			},
		});
		this.router.post(
			"/:id/comentarios",
			guard.handle(recurso, "leer"),
			controller.crear,
		);

		docs.registerPath({
			method: "put",
			path: "/{id}/comentarios/{comentarioId}",
			tags,
			security,
			summary: "Editar un comentario propio",
			request: { params: comentarioIdSchema, body: cuerpo },
			responses: {
				200: jsonResponse(comentarioDtoSchema, "Comentario editado"),
				400: errorResponse("Datos inválidos"),
				...protectedErrorResponses(`${recurso}:leer`),
				403: errorResponse("No es su autor"),
				404: errorResponse("Tarea o comentario no encontrado"),
			},
		});
		this.router.put(
			"/:id/comentarios/:comentarioId",
			guard.handle(recurso, "leer"),
			controller.actualizar,
		);

		docs.registerPath({
			method: "delete",
			path: "/{id}/comentarios/{comentarioId}",
			tags,
			security,
			summary: "Eliminar un comentario",
			description:
				"Su autor o quien gestiona las tareas de ahí (RN-22); en una personal, su dueño.",
			request: { params: comentarioIdSchema },
			responses: {
				204: { description: "Comentario eliminado" },
				...protectedErrorResponses(`${recurso}:leer`),
				403: errorResponse("Sin permiso para eliminarlo"),
				404: errorResponse("Tarea o comentario no encontrado"),
			},
		});
		this.router.delete(
			"/:id/comentarios/:comentarioId",
			guard.handle(recurso, "leer"),
			controller.eliminar,
		);
	}
}
