import { z } from "@hono/zod-openapi";

export const adjuntoIdSchema = z.object({
	id: z
		.string()
		.regex(/^\d+$/, "El ID debe ser un número válido")
		.transform(Number),
});

// ── Respuestas (sólo documentación OpenAPI) ──────────────────────────────────

export const adjuntoDtoSchema = z
	.object({
		id: z.number().int().openapi({ example: 12 }),
		url: z.string().openapi({ example: "/api/adjuntos/12" }),
		tipo: z.string().openapi({ example: "image/png" }),
		bytes: z.number().int().openapi({ example: 48213 }),
	})
	.openapi("AdjuntoDto");
