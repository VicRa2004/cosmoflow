import { OpenAPIHono, z } from "@hono/zod-openapi";
import {
	errorResponse,
	jsonResponse,
	protectedErrorResponses,
} from "@/core/shared/infrastructure/http/openapi";
import type { AuthMiddleware } from "@/modules/auth";
import { idempotencia } from "@/core/shared/infrastructure/http/idempotencia";
import type { PermisoGuard } from "@/core/shared/infrastructure/http/permisoGuard";
import type { PapeleraTareaController } from "../controllers/PapeleraTareaController";
import { TareaController } from "../controllers/TareaController";
import {
	accionLoteTareasSchema,
	actualizarTareaSchema,
	calendarioTareasSchema,
	crearTareaSchema,
	eliminarLoteTareasSchema,
	estadisticasTareasDtoSchema,
	estadisticasTareasSchema,
	moverTareaSchema,
	obtenerTareasSchema,
	paginacionSchema,
	resultadoLoteTareasSchema,
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
		papelera: PapeleraTareaController,
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
		this.router.post(
			"/",
			guard.handle(recurso, "crear"),
			// La app móvil reintenta las altas hechas sin conexión.
			idempotencia,
			controller.crear,
		);

		docs.registerPath({
			method: "get",
			path: "/",
			tags,
			security,
			summary: "Listar tareas (paginado)",
			description:
				"Por vencimiento más próximo (sin fecha al final) y, a igual fecha, por prioridad.",
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

		// Antes de "/{id}": si no, "papelera" se tomaría por un ID.
		docs.registerPath({
			method: "get",
			path: "/papelera",
			tags,
			security,
			summary: "Papelera de tareas",
			description:
				"Las borradas que el usuario aún vería, las borradas más recientemente primero. Se borran del todo a los 30 días.",
			request: { query: paginacionSchema },
			responses: {
				200: jsonResponse(tareaPaginaSchema, "Lista paginada"),
				400: errorResponse("Parámetros inválidos"),
				...protectedErrorResponses(`${recurso}:leer`),
			},
		});
		this.router.get(
			"/papelera",
			guard.handle(recurso, "leer"),
			papelera.obtenerTodos,
		);

		docs.registerPath({
			method: "post",
			path: "/papelera/{id}/restaurar",
			tags,
			security,
			summary: "Restaurar una tarea de la papelera",
			request: { params: tareaIdSchema },
			responses: {
				204: { description: "Tarea restaurada" },
				...protectedErrorResponses(`${recurso}:eliminar`),
				403: errorResponse("Sin permiso para eliminar tareas ahí (RN-22)"),
				404: errorResponse("No está en la papelera"),
			},
		});
		this.router.post(
			"/papelera/:id/restaurar",
			guard.handle(recurso, "eliminar"),
			papelera.restaurar,
		);

		docs.registerPath({
			method: "delete",
			path: "/papelera/{id}",
			tags,
			security,
			summary: "Borrar del todo una tarea de la papelera",
			request: { params: tareaIdSchema },
			responses: {
				204: { description: "Tarea borrada" },
				...protectedErrorResponses(`${recurso}:eliminar`),
				403: errorResponse("Sin permiso para eliminar tareas ahí (RN-22)"),
				404: errorResponse("No está en la papelera"),
			},
		});
		this.router.delete(
			"/papelera/:id",
			guard.handle(recurso, "eliminar"),
			papelera.eliminar,
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
			path: "/calendario",
			tags,
			security,
			summary: "Tareas con fecha en un rango (calendario)",
			description:
				"Personales, asignadas y de las organizaciones, equipos y proyectos del usuario. Cada tarea cuenta en su vencimiento o, sin él, en su inicio. Máximo 500.",
			request: { query: calendarioTareasSchema },
			responses: {
				200: jsonResponse(z.array(tareaDtoSchema), "Tareas del rango"),
				400: errorResponse("Parámetros inválidos"),
				...protectedErrorResponses(`${recurso}:leer`),
			},
		});
		this.router.get(
			"/calendario",
			guard.handle(recurso, "leer"),
			controller.calendario,
		);

		docs.registerPath({
			method: "get",
			path: "/estadisticas",
			tags,
			security,
			summary:
				"Estadísticas de las tareas de una organización, equipo o proyecto",
			description:
				"`organizacionId` solo cuenta las de la organización, sin equipo ni proyecto.",
			request: { query: estadisticasTareasSchema },
			responses: {
				200: jsonResponse(estadisticasTareasDtoSchema, "Recuentos"),
				400: errorResponse("Parámetros inválidos"),
				...protectedErrorResponses(`${recurso}:leer`),
				404: errorResponse("Organización, equipo o proyecto no encontrado"),
			},
		});
		this.router.get(
			"/estadisticas",
			guard.handle(recurso, "leer"),
			controller.estadisticas,
		);

		docs.registerPath({
			method: "post",
			path: "/lote",
			tags,
			security,
			summary: "Aplicar una acción en lote sobre varias tareas",
			request: {
				body: {
					required: true,
					content: { "application/json": { schema: accionLoteTareasSchema } },
				},
			},
			responses: {
				200: jsonResponse(resultadoLoteTareasSchema, "Tareas actualizadas"),
				400: errorResponse(
					"Validación fallida, tags ajenos o dependencia bloqueante",
				),
				...protectedErrorResponses(`${recurso}:actualizar`),
				404: errorResponse("Alguna tarea no fue encontrada"),
			},
		});
		this.router.post(
			"/lote",
			guard.handle(recurso, "actualizar"),
			controller.accionLote,
		);

		docs.registerPath({
			method: "post",
			path: "/lote/eliminar",
			tags,
			security,
			summary: "Mover varias tareas a la papelera",
			request: {
				body: {
					required: true,
					content: {
						"application/json": { schema: eliminarLoteTareasSchema },
					},
				},
			},
			responses: {
				200: jsonResponse(resultadoLoteTareasSchema, "Tareas eliminadas"),
				400: errorResponse("Validación fallida"),
				...protectedErrorResponses(`${recurso}:eliminar`),
				403: errorResponse("Sin permiso para eliminar tareas ahí (RN-22)"),
				404: errorResponse("Alguna tarea no fue encontrada"),
			},
		});
		this.router.post(
			"/lote/eliminar",
			guard.handle(recurso, "eliminar"),
			controller.eliminarLote,
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

		docs.registerPath({
			method: "post",
			path: "/{id}/duplicar",
			tags,
			security,
			summary: "Duplicar una tarea en el mismo contexto",
			request: { params: tareaIdSchema },
			responses: {
				201: jsonResponse(tareaDtoSchema, "Tarea duplicada"),
				...protectedErrorResponses(`${recurso}:crear`),
				403: errorResponse(
					"En un equipo con líder, sin ser líder ni delegado (RN-22)",
				),
				404: errorResponse("Tarea no encontrada"),
			},
		});
		this.router.post(
			"/:id/duplicar",
			guard.handle(recurso, "crear"),
			controller.duplicar,
		);
	}
}
