import { OpenAPIHono } from "@hono/zod-openapi";
import {
	errorResponse,
	jsonResponse,
} from "@/core/shared/infrastructure/http/openapi";
import type { AuthMiddleware } from "@/modules/auth";
import type { BandejaNotificacionController } from "../controllers/BandejaNotificacionController";
import type { DispositivoPushController } from "../controllers/DispositivoPushController";
import type { NotificacionController } from "../controllers/NotificacionController";
import {
	bandejaNotificacionesSchema,
	eliminarDispositivoPushSchema,
	enlaceTelegramSchema,
	estadoMovilSchema,
	estadoTelegramSchema,
	notificacionIdParamSchema,
	obtenerNotificacionesSchema,
	preferenciasSchema,
	preferenciasUsuarioSchema,
	registrarDispositivoPushSchema,
} from "../schemas/notificacionSchemas";

const tags = ["Notificaciones"];
const security = [{ bearerAuth: [] }];

/** Se monta en `/api/notificaciones`. Sin permiso propio: son del usuario autenticado. */
export class NotificacionRouter {
	public readonly router = new OpenAPIHono();

	constructor(
		authMiddleware: AuthMiddleware,
		controller: NotificacionController,
		dispositivosController: DispositivoPushController,
		bandejaController: BandejaNotificacionController,
	) {
		const docs = this.router.openAPIRegistry;
		this.router.use(authMiddleware.handle);

		docs.registerPath({
			method: "get",
			path: "/",
			tags,
			security,
			summary: "Listar mis notificaciones dentro de la app (campana)",
			request: { query: obtenerNotificacionesSchema },
			responses: {
				200: jsonResponse(
					bandejaNotificacionesSchema,
					"Notificaciones paginadas y contador de no leídas",
				),
				401: errorResponse("No autenticado"),
			},
		});
		this.router.get("/", bandejaController.obtenerTodos);

		docs.registerPath({
			method: "post",
			path: "/leer-todas",
			tags,
			security,
			summary: "Marcar todas mis notificaciones como leídas",
			responses: {
				204: { description: "Marcadas como leídas" },
				401: errorResponse("No autenticado"),
			},
		});
		this.router.post("/leer-todas", bandejaController.marcarTodasLeidas);

		docs.registerPath({
			method: "put",
			path: "/{id}/leer",
			tags,
			security,
			summary: "Marcar una notificación como leída",
			request: { params: notificacionIdParamSchema },
			responses: {
				204: { description: "Marcada como leída" },
				401: errorResponse("No autenticado"),
				404: errorResponse("Notificación no encontrada"),
			},
		});
		this.router.put("/:id/leer", bandejaController.marcarLeida);

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

		docs.registerPath({
			method: "get",
			path: "/movil",
			tags,
			security,
			summary: "¿Hay push móvil configurado y cuántos dispositivos tengo?",
			responses: {
				200: jsonResponse(estadoMovilSchema, "Estado del canal móvil"),
				401: errorResponse("No autenticado"),
			},
		});
		this.router.get("/movil", dispositivosController.estado);

		docs.registerPath({
			method: "post",
			path: "/dispositivos",
			tags,
			security,
			summary: "Registrar o actualizar el token push de un dispositivo móvil",
			request: {
				body: {
					required: true,
					content: {
						"application/json": { schema: registrarDispositivoPushSchema },
					},
				},
			},
			responses: {
				204: { description: "Dispositivo registrado" },
				400: errorResponse("Token o plataforma no válidos"),
				401: errorResponse("No autenticado"),
			},
		});
		this.router.post("/dispositivos", dispositivosController.registrar);

		docs.registerPath({
			method: "delete",
			path: "/dispositivos",
			tags,
			security,
			summary: "Dar de baja el token push de un dispositivo móvil",
			request: {
				body: {
					required: true,
					content: {
						"application/json": { schema: eliminarDispositivoPushSchema },
					},
				},
			},
			responses: {
				204: { description: "Dispositivo dado de baja" },
				400: errorResponse("Token no válido"),
				401: errorResponse("No autenticado"),
			},
		});
		this.router.delete("/dispositivos", dispositivosController.eliminar);
	}
}
