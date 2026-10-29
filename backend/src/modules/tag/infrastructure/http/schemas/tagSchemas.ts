import { z } from "@hono/zod-openapi";

const nombre = z
	.string()
	.trim()
	.min(1, "El nombre es obligatorio")
	.max(64, "Máximo 64 caracteres");

export const crearTagSchema = z.object({ nombre });

export const actualizarTagSchema = z.object({ nombre: nombre.optional() });

export const tagIdSchema = z.object({
	id: z
		.string()
		.regex(/^\d+$/, "El ID debe ser un número válido")
		.transform(Number),
});

export const obtenerTagsSchema = z.object({
	pagina: z.string().regex(/^\d+$/).transform(Number).optional().default(1),
	limite: z.string().regex(/^\d+$/).transform(Number).optional().default(10),
	nombre: z.string().trim().min(1).max(128).optional(),
});

// ── Respuestas (sólo documentación OpenAPI) ──────────────────────────────────

export const tagDtoSchema = z
	.object({
		id: z.number().int().openapi({ example: 1 }),
		nombre: z.string().openapi({ example: "urgente" }),
	})
	.openapi("TagDto");

export const tagPaginaSchema = z.object({
	datos: z.array(tagDtoSchema),
	pagina: z.number().int().openapi({ example: 1 }),
	totalElementos: z.number().int().openapi({ example: 10 }),
	totalPaginas: z.number().int().openapi({ example: 1 }),
});
