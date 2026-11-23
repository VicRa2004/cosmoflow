import { z } from "@hono/zod-openapi";

const id = z
	.string()
	.regex(/^\d+$/, "El ID debe ser un número válido")
	.transform(Number);
const numero = z.string().regex(/^\d+$/).transform(Number);

export const tareaComentariosSchema = z.object({ id });

export const comentarioIdSchema = z.object({ id, comentarioId: id });

export const listarComentariosSchema = z.object({
	pagina: numero.optional().default(1),
	limite: numero
		.optional()
		.default(50)
		.refine((n) => n <= 100, "Máximo 100 por página"),
});

export const comentarioSchema = z.object({
	contenido: z
		.string()
		.trim()
		.min(1, "El comentario no puede estar vacío")
		.max(10_000, "Máximo 10.000 caracteres")
		.openapi({ example: "Listo, [@Ana](mencion:12) ¿lo revisas?" }),
});

export const crearComentarioSchema = comentarioSchema.extend({
	padreId: z
		.number()
		.int()
		.positive("El comentario padre no es válido")
		.nullable()
		.optional()
		.openapi({
			example: 1,
			description: "ID del comentario al que responde (hilo de 1 nivel)",
		}),
});

// ── Respuestas (sólo documentación OpenAPI) ──────────────────────────────────

export const comentarioDtoSchema = z
	.object({
		id: z.number().int().openapi({ example: 1 }),
		tareaId: z.number().int().openapi({ example: 42 }),
		autorId: z.number().int().openapi({ example: 3 }),
		autorNombre: z.string().openapi({ example: "Ana" }),
		autorAvatarUrl: z
			.string()
			.nullable()
			.openapi({ example: "/api/avatares/3?v=abc" }),
		padreId: z.number().int().nullable().openapi({ example: null }),
		contenido: z.string(),
		createdAt: z.iso.datetime(),
		editadoEn: z.iso.datetime().nullable(),
	})
	.openapi("ComentarioTareaDto");

export const comentarioPaginaSchema = z.object({
	datos: z.array(comentarioDtoSchema),
	pagina: z.number().int().openapi({ example: 1 }),
	totalElementos: z.number().int().openapi({ example: 3 }),
	totalPaginas: z.number().int().openapi({ example: 1 }),
});
