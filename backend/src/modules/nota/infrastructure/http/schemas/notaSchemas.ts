import { z } from "@hono/zod-openapi";

const campos = {
	titulo: z
		.string()
		.trim()
		.min(1, "El título es obligatorio")
		.max(255, "Máximo 255 caracteres"),
	contenido: z.string().max(100_000, "Contenido demasiado largo").optional(),
	tagIds: z.array(z.number().int().positive()).max(50).optional(),
};

/** Sin `proyectoId`, personal (RN-50). */
export const crearNotaSchema = z.object({
	...campos,
	proyectoId: z.number().int().positive().optional(),
});

export const actualizarNotaSchema = z.object(campos).partial();

export const notaIdSchema = z.object({
	id: z
		.string()
		.regex(/^\d+$/, "El ID debe ser un número válido")
		.transform(Number),
});

const numero = z.string().regex(/^\d+$/).transform(Number);

export const obtenerNotasSchema = z.object({
	pagina: numero.optional().default(1),
	limite: numero.optional().default(10),
	busqueda: z.string().trim().min(1).max(128).optional(),
	tagId: numero.optional(),
	/** Sin él, las personales. */
	proyectoId: numero.optional(),
});

// ── Respuestas (sólo documentación OpenAPI) ──────────────────────────────────

export const notaDtoSchema = z
	.object({
		id: z.number().int().openapi({ example: 1 }),
		titulo: z.string().openapi({ example: "Ideas para el viaje" }),
		contenido: z.string().openapi({ example: "## Lugares\n- Lisboa" }),
		tagIds: z.array(z.number().int()),
		organizacionId: z.number().int().nullable(),
		proyectoId: z.number().int().nullable(),
		updatedAt: z.iso.datetime().openapi({ example: "2026-10-28T10:00:00Z" }),
	})
	.openapi("NotaDto");

export const notaPaginaSchema = z.object({
	datos: z.array(notaDtoSchema),
	pagina: z.number().int().openapi({ example: 1 }),
	totalElementos: z.number().int().openapi({ example: 10 }),
	totalPaginas: z.number().int().openapi({ example: 1 }),
});
