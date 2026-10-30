import { z } from "@hono/zod-openapi";
import {
	CANALES_NOTIFICACION,
	EVENTOS_NOTIFICACION,
} from "../../../domain/catalogo";

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
