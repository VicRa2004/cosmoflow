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
