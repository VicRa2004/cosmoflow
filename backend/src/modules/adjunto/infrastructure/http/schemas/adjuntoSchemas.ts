import { z } from "@hono/zod-openapi";

export const adjuntoIdSchema = z.object({
	id: z
		.string()
		.regex(/^\d+$/, "El ID debe ser un número válido")
		.transform(Number),
});

const id = z.string().regex(/^\d+$/).transform(Number);

/** `?organizacionId=`, `?equipoId=` o `?proyectoId=`: la imagen se comparte con sus miembros. */
export const ambitoAdjuntoQuerySchema = z.object({
	organizacionId: id.optional(),
	equipoId: id.optional(),
	proyectoId: id.optional(),
});

export const ambitoAdjuntoSchema = ambitoAdjuntoQuerySchema
	.refine(
		(v) =>
			[v.organizacionId, v.equipoId, v.proyectoId].filter(
				(d) => d !== undefined,
			).length <= 1,
		{ message: "Con una organización, un equipo o un proyecto: solo uno" },
	)
	.transform((v) =>
		v.equipoId
			? { equipoId: v.equipoId }
			: v.proyectoId
				? { proyectoId: v.proyectoId }
				: v.organizacionId
					? { organizacionId: v.organizacionId }
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
