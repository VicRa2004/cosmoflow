import { OpenAPIHono } from "@hono/zod-openapi";
import {
	errorResponse,
	jsonResponse,
} from "@/core/shared/infrastructure/http/openapi";
import type { AuthMiddleware } from "@/modules/auth";
import type { NotificacionController } from "../controllers/NotificacionController";
import {
	preferenciasSchema,
	preferenciasUsuarioSchema,
} from "../schemas/notificacionSchemas";

const tags = ["Notificaciones"];
const security = [{ bearerAuth: [] }];

/** Se monta en `/api/notificaciones`. Sin permiso propio: son del usuario autenticado. */
export class NotificacionRouter {
	public readonly router = new OpenAPIHono();

	constructor(
		authMiddleware: AuthMiddleware,
		controller: NotificacionController,
	) {
		const docs = this.router.openAPIRegistry;
		this.router.use(authMiddleware.handle);

		docs.registerPath({
			method: "get",
			path: "/preferencias",
			tags,
			security,
			summary: "Obtener mis preferencias de notificación (evento × canal)",
			responses: {
				200: jsonResponse(preferenciasUsuarioSchema, "Matriz completa"),
				401: errorResponse("No autenticado"),
			},
		});
		this.router.get("/preferencias", controller.obtenerPreferencias);

		docs.registerPath({
			method: "put",
			path: "/preferencias",
			tags,
			security,
			summary: "Cambiar mis preferencias; las no enviadas no cambian",
			request: {
				body: {
					required: true,
					content: { "application/json": { schema: preferenciasSchema } },
				},
			},
			responses: {
				200: jsonResponse(preferenciasUsuarioSchema, "Matriz completa"),
				400: errorResponse("Evento o canal desconocido"),
				401: errorResponse("No autenticado"),
			},
		});
		this.router.put("/preferencias", controller.actualizarPreferencias);
	}
}
