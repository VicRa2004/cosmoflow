import { z } from "@hono/zod-openapi";
import {
	CANALES_NOTIFICACION,
	EVENTOS_NOTIFICACION,
} from "../../../domain/catalogo";
import { PLATAFORMAS_PUSH } from "../../../domain/repository/DispositivoPushRepository";

export const preferenciaSchema = z
	.object({
		evento: z.enum(EVENTOS_NOTIFICACION).openapi({ example: "tareaAsignada" }),
		canal: z.enum(CANALES_NOTIFICACION).openapi({ example: "correo" }),
		activo: z.boolean(),
	})
	.openapi("PreferenciaNotificacion");

export const preferenciasSchema = z
	.array(preferenciaSchema)
	.max(EVENTOS_NOTIFICACION.length * CANALES_NOTIFICACION.length);

export const preferenciasUsuarioSchema = z.array(
	preferenciaSchema
		.extend({
			/** `false`: no eligió; vale lo de cada organización o el valor por defecto. */
			personalizado: z.boolean(),
		})
		.openapi("PreferenciaNotificacionUsuario"),
);

export const organizacionIdParamSchema = z.object({
	organizacionId: z
		.string()
		.regex(/^\d+$/, "El ID debe ser un número válido")
		.transform(Number),
});

export const estadoTelegramSchema = z
	.object({
		/** `false`: el servidor no tiene bot; la interfaz oculta Telegram. */
		disponible: z.boolean(),
		vinculado: z.boolean(),
	})
	.openapi("EstadoTelegram");

export const enlaceTelegramSchema = z
	.object({
		enlace: z
			.string()
			.openapi({ example: "https://t.me/cosmoflow_bot?start=abc123" }),
	})
	.openapi("EnlaceTelegram");

export const estadoMovilSchema = z
	.object({
		/** `false`: el servidor no tiene FCM configurado; la interfaz oculta el canal móvil. */
		disponible: z.boolean(),
		/** Número de dispositivos móviles registrados por el usuario. */
		dispositivos: z.number().int().min(0),
	})
	.openapi("EstadoMovil");

export const registrarDispositivoPushSchema = z
	.object({
		token: z
			.string()
			.trim()
			.min(10, "El token del dispositivo no es válido")
			.max(512, "El token del dispositivo es demasiado largo")
			.openapi({ example: "fcm_token_dispositivo_abc123" }),
		plataforma: z.enum(PLATAFORMAS_PUSH).openapi({ example: "android" }),
	})
	.openapi("RegistrarDispositivoPush");

export const eliminarDispositivoPushSchema = z
	.object({
		token: z
			.string()
			.trim()
			.min(10, "El token del dispositivo no es válido")
			.max(512, "El token del dispositivo es demasiado largo")
			.openapi({ example: "fcm_token_dispositivo_abc123" }),
	})
	.openapi("EliminarDispositivoPush");

const numeroPositivo = z
	.string()
	.regex(/^\d+$/, "Debe ser un número válido")
	.transform(Number)
	.refine((n) => n >= 1, "Debe ser mayor que cero");

export const notificacionIdParamSchema = z.object({
	id: numeroPositivo,
});

export const obtenerNotificacionesSchema = z.object({
	pagina: numeroPositivo.optional().default(1),
	limite: numeroPositivo
		.refine((n) => n <= 50, "Máximo 50 por página")
		.optional()
		.default(20),
	soloNoLeidas: z
		.literal("true")
		.transform(() => true)
		.optional(),
});

export const notificacionAppSchema = z
	.object({
		id: z.number().int().openapi({ example: 1 }),
		asunto: z
			.string()
			.openapi({ example: "Te asignaron una tarea: Preparar demo" }),
		texto: z
			.string()
			.openapi({ example: "Ana te asignó la tarea «Preparar demo»." }),
		enlace: z
			.string()
			.openapi({ example: "https://app.cosmoflow.dev/tareas/42" }),
		tipo: z.enum(["tarea", "nota"]).nullable(),
		recursoId: z.number().int().nullable(),
		leida: z.boolean(),
		createdAt: z.string().openapi({ example: "2026-11-20T18:00:00.000Z" }),
	})
	.openapi("NotificacionApp");

export const bandejaNotificacionesSchema = z
	.object({
		datos: z.array(notificacionAppSchema),
		pagina: z.number().int().openapi({ example: 1 }),
		totalElementos: z.number().int().openapi({ example: 3 }),
		totalPaginas: z.number().int().openapi({ example: 1 }),
		noLeidas: z.number().int().openapi({ example: 2 }),
	})
	.openapi("BandejaNotificaciones");
