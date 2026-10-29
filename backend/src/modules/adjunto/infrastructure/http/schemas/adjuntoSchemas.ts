import { z } from "@hono/zod-openapi";

export const adjuntoIdSchema = z.object({
	id: z
		.string()
		.regex(/^\d+$/, "El ID debe ser un número válido")
		.transform(Number),
});

const id = z.string().regex(/^\d+$/).transform(Number);

/** `?equipoId=` o `?proyectoId=`: la imagen se comparte con sus miembros. */
export const ambitoAdjuntoQuerySchema = z.object({
	equipoId: id.optional(),
	proyectoId: id.optional(),
});

export const ambitoAdjuntoSchema = ambitoAdjuntoQuerySchema
	.refine((v) => v.equipoId === undefined || v.proyectoId === undefined, {
		message: "Con un equipo o con un proyecto, no con los dos",
	})
	.transform((v) =>
		v.equipoId
			? { equipoId: v.equipoId }
			: v.proyectoId
				? { proyectoId: v.proyectoId }
				: undefined,
	);

// ── Respuestas (sólo documentación OpenAPI) ──────────────────────────────────

export const adjuntoDtoSchema = z
	.object({
		id: z.number().int().openapi({ example: 12 }),
		url: z.string().openapi({ example: "/api/adjuntos/12" }),
		tipo: z.string().openapi({ example: "image/png" }),
		bytes: z.number().int().openapi({ example: 48213 }),
	})
	.openapi("AdjuntoDto");
