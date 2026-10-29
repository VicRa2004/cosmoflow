import { OpenAPIHono } from "@hono/zod-openapi";
import {
	errorResponse,
	jsonResponse,
	protectedErrorResponses,
} from "@/core/shared/infrastructure/http/openapi";
import type { AuthMiddleware } from "@/modules/auth";
import type { PermisoGuard } from "@/core/shared/infrastructure/http/permisoGuard";
import { TareaController } from "../controllers/TareaController";
import {
	actualizarTareaSchema,
	crearTareaSchema,
	moverTareaSchema,
	obtenerTareasSchema,
	paginacionSchema,
	tareaDtoSchema,
	tareaIdSchema,
	tareaPaginaSchema,
} from "../schemas/tareaSchemas";

const tags = ["Tareas"];
const security = [{ bearerAuth: [] }];
const recurso = "tareas";

export class TareaRouter {
	public readonly router = new OpenAPIHono();

	constructor(
		authMiddleware: AuthMiddleware,
		guard: PermisoGuard,
		controller: TareaController,
	) {
		const docs = this.router.openAPIRegistry;
		this.router.use(authMiddleware.handle);

		docs.registerPath({
			method: "post",
			path: "/",
			tags,
			security,
			summary: "Crear tarea personal, o en un equipo o proyecto (RN-22)",
			request: {
				body: {
					required: true,
					content: { "application/json": { schema: crearTareaSchema } },
				},
			},
			responses: {
				201: jsonResponse(tareaDtoSchema, "Tarea creada"),
				400: errorResponse(
					"Validación fallida, fechas incoherentes o tags ajenos",
				),
				...protectedErrorResponses(`${recurso}:crear`),
				403: errorResponse(
					"En un equipo con líder, sin ser líder ni delegado (RN-22)",
				),
				404: errorResponse("Equipo o proyecto no encontrado"),
			},
		});
		this.router.post("/", guard.handle(recurso, "crear"), controller.crear);

		docs.registerPath({
			method: "get",
			path: "/",
			tags,
			security,
			summary: "Listar tareas (paginado)",
			request: { query: obtenerTareasSchema },
			responses: {
				200: jsonResponse(tareaPaginaSchema, "Lista paginada"),
				400: errorResponse("Parámetros inválidos"),
				...protectedErrorResponses(`${recurso}:leer`),
			},
		});
		this.router.get(
			"/",
			guard.handle(recurso, "leer"),
			controller.obtenerTodos,
		);

		// Antes de "/{id}": si no, "pendientes" se tomaría por un ID.
		docs.registerPath({
			method: "get",
			path: "/pendientes",
			tags,
			security,
			summary: "Tareas pendientes",
			description:
				"Pendientes y en progreso, por vencimiento más próximo (sin fecha al final) y, a igual fecha, por prioridad (RN-43).",
			request: { query: paginacionSchema },
			responses: {
				200: jsonResponse(tareaPaginaSchema, "Lista paginada"),
				400: errorResponse("Parámetros inválidos"),
				...protectedErrorResponses(`${recurso}:leer`),
			},
		});
		this.router.get(
			"/pendientes",
			guard.handle(recurso, "leer"),
			controller.obtenerPendientes,
		);

		docs.registerPath({
			method: "get",
			path: "/{id}",
			tags,
			security,
			summary: "Obtener tarea por ID",
			request: { params: tareaIdSchema },
			responses: {
				200: jsonResponse(tareaDtoSchema, "Tarea encontrada"),
				...protectedErrorResponses(`${recurso}:leer`),
				404: errorResponse("Tarea no encontrada"),
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
			summary: "Actualizar tarea",
			request: {
				params: tareaIdSchema,
				body: {
					required: true,
					content: { "application/json": { schema: actualizarTareaSchema } },
				},
			},
			responses: {
				200: jsonResponse(tareaDtoSchema, "Tarea actualizada"),
				400: errorResponse(
					"Validación fallida, fechas incoherentes o tags ajenos",
				),
				...protectedErrorResponses(`${recurso}:actualizar`),
				403: errorResponse(
					"Cambiar responsables en un equipo con líder sin ser líder ni delegado (RN-22)",
				),
				404: errorResponse("Tarea no encontrada"),
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
			summary: "Eliminar tarea",
			request: { params: tareaIdSchema },
			responses: {
				204: { description: "Tarea eliminada" },
				...protectedErrorResponses(`${recurso}:eliminar`),
				403: errorResponse("Sin permiso para eliminar tareas ahí (RN-22)"),
				404: errorResponse("Tarea no encontrada"),
			},
		});
		this.router.delete(
			"/:id",
			guard.handle(recurso, "eliminar"),
			controller.eliminar,
		);

		docs.registerPath({
			method: "post",
			path: "/{id}/mover",
			tags,
			security,
			summary:
				"Mover una tarea personal a un equipo o proyecto (RN-45, sin vuelta atrás)",
			request: {
				params: tareaIdSchema,
				body: {
					required: true,
					content: { "application/json": { schema: moverTareaSchema } },
				},
			},
			responses: {
				200: jsonResponse(tareaDtoSchema, "Tarea movida"),
				400: errorResponse("Ya es de un equipo o proyecto"),
				...protectedErrorResponses(`${recurso}:actualizar`),
				403: errorResponse(
					"Sin permiso para crear tareas en el destino (RN-22)",
				),
				404: errorResponse("Tarea, equipo o proyecto no encontrado"),
			},
		});
		this.router.post(
			"/:id/mover",
			guard.handle(recurso, "actualizar"),
			controller.mover,
		);
	}
}
