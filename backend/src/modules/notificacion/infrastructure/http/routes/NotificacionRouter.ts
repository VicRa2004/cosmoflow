import { OpenAPIHono } from "@hono/zod-openapi";
import {
	errorResponse,
	jsonResponse,
} from "@/core/shared/infrastructure/http/openapi";
import type { AuthMiddleware } from "@/modules/auth";
import type { NotificacionController } from "../controllers/NotificacionController";
import {
	enlaceTelegramSchema,
	estadoTelegramSchema,
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

		docs.registerPath({
			method: "get",
			path: "/telegram",
			tags,
			security,
			summary: "¿Hay bot de Telegram y lo tengo vinculado?",
			responses: {
				200: jsonResponse(estadoTelegramSchema, "Estado"),
				401: errorResponse("No autenticado"),
			},
		});
		this.router.get("/telegram", controller.estadoTelegram);

		docs.registerPath({
			method: "post",
			path: "/telegram/vincular",
			tags,
			security,
			summary:
				"Enlace de un solo uso (15 min) para vincular mi cuenta de Telegram",
			responses: {
				200: jsonResponse(enlaceTelegramSchema, "Enlace t.me"),
				401: errorResponse("No autenticado"),
				503: errorResponse("Telegram no está configurado"),
			},
		});
		this.router.post("/telegram/vincular", controller.vincularTelegram);

		docs.registerPath({
			method: "delete",
			path: "/telegram",
			tags,
			security,
			summary: "Desvincular mi cuenta de Telegram",
			responses: {
				204: { description: "Desvinculada" },
				401: errorResponse("No autenticado"),
			},
		});
		this.router.delete("/telegram", controller.desvincularTelegram);
	}
}
