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
