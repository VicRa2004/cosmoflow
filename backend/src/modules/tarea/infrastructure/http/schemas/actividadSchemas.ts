import { z } from "@hono/zod-openapi";
import { EVENTOS_ACTIVIDAD } from "../../../domain/repository/ActividadTareaRepository";

const numero = z.string().regex(/^\d+$/).transform(Number);

export const listarActividadSchema = z.object({
	antesDe: numero.optional(),
	limite: numero
		.optional()
		.default(50)
		.refine((n) => n >= 1 && n <= 100, "Entre 1 y 100 por página"),
});

// ── Respuestas (sólo documentación OpenAPI) ──────────────────────────────────

export const actividadTareaSchema = z
	.object({
		datos: z.array(
			z.object({
				id: z.number().int(),
				evento: z.enum(EVENTOS_ACTIVIDAD),
				datos: z.record(z.string(), z.unknown()).openapi({
					example: { tareaId: 42, anterior: "pendiente", nuevo: "completada" },
				}),
				actorId: z.number().int().nullable(),
				ocurridoEn: z.iso.datetime(),
			}),
		),
		nombres: z
			.record(z.string(), z.string())
			.openapi({ example: { "3": "Ana" } }),
		hayMas: z.boolean(),
	})
	.openapi("ActividadTarea");
