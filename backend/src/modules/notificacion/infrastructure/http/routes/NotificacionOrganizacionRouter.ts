import { OpenAPIHono } from "@hono/zod-openapi";
import {
	errorResponse,
	jsonResponse,
	protectedErrorResponses,
} from "@/core/shared/infrastructure/http/openapi";
import type { PermisoGuard } from "@/core/shared/infrastructure/http/permisoGuard";
import type { AuthMiddleware } from "@/modules/auth";
import type { NotificacionController } from "../controllers/NotificacionController";
import {
	organizacionIdParamSchema,
	preferenciasSchema,
} from "../schemas/notificacionSchemas";

const tags = ["Notificaciones"];
const security = [{ bearerAuth: [] }];
const recurso = "organizaciones";

/** Se monta en `/api/organizaciones/{organizacionId}/notificaciones` (RN-92). */
export class NotificacionOrganizacionRouter {
	public readonly router = new OpenAPIHono();

	constructor(
		authMiddleware: AuthMiddleware,
		guard: PermisoGuard,
		controller: NotificacionController,
	) {
		const docs = this.router.openAPIRegistry;
		this.router.use(authMiddleware.handle);

		docs.registerPath({
			method: "get",
			path: "/",
			tags,
			security,
			summary: "Valores por defecto de notificación de la organización",
			request: { params: organizacionIdParamSchema },
			responses: {
				200: jsonResponse(preferenciasSchema, "Matriz completa"),
				...protectedErrorResponses(`${recurso}:leer`),
				404: errorResponse("Organización no encontrada"),
			},
		});
		this.router.get(
			"/",
			guard.handle(recurso, "leer"),
			controller.obtenerDeOrganizacion,
		);

		docs.registerPath({
			method: "put",
			path: "/",
			tags,
			security,
			summary:
				"Cambiar los valores por defecto (organizacion:editar); la elección de cada miembro gana",
			request: {
				params: organizacionIdParamSchema,
				body: {
					required: true,
					content: { "application/json": { schema: preferenciasSchema } },
				},
			},
			responses: {
				200: jsonResponse(preferenciasSchema, "Matriz completa"),
				400: errorResponse("Evento o canal desconocido"),
				...protectedErrorResponses(`${recurso}:actualizar`),
				404: errorResponse("Organización no encontrada"),
			},
		});
		this.router.put(
			"/",
			guard.handle(recurso, "actualizar"),
			controller.actualizarDeOrganizacion,
		);
	}
}
