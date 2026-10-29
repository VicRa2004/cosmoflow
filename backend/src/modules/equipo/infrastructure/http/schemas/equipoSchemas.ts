import { z } from "@hono/zod-openapi";

const idParam = z
	.string()
	.regex(/^\d+$/, "El ID debe ser un número válido")
	.transform(Number);
const nombre = z
	.string()
	.trim()
	.min(1, "El nombre es obligatorio")
	.max(100, "Máximo 100 caracteres");
const descripcion = z.string().trim().max(500, "Máximo 500 caracteres");
const color = z
	.string()
	.regex(/^#[0-9a-fA-F]{6}$/, "El color debe ser hexadecimal (#rrggbb)")
	.transform((c) => c.toLowerCase());
const ids = z.array(z.number().int().positive()).max(500);

export const organizacionIdParamSchema = z.object({ organizacionId: idParam });
export const equipoParamsSchema = organizacionIdParamSchema.extend({
	id: idParam,
});

export const crearEquipoSchema = z.object({
	nombre,
	descripcion: descripcion.optional().default(""),
	color,
	liderId: z.number().int().positive().nullable().optional().default(null),
	miembroIds: ids.min(2, "Un equipo necesita al menos 2 miembros"),
	tagIds: ids.optional().default([]),
});

export const actualizarEquipoSchema = z.object({
	nombre: nombre.optional(),
	descripcion: descripcion.optional(),
	color: color.optional(),
	/** `null` quita el líder. */
	liderId: z.number().int().positive().nullable().optional(),
	miembroIds: ids.min(2, "Un equipo necesita al menos 2 miembros").optional(),
	tagIds: ids.optional(),
});

export const delegadosSchema = z.object({ usuarioIds: ids });

export const obtenerEquiposSchema = z.object({ tagId: idParam.optional() });

// ── Respuestas (sólo documentación OpenAPI) ──────────────────────────────────

export const equipoDtoSchema = z
	.object({
		id: z.number().int().openapi({ example: 1 }),
		nombre: z.string().openapi({ example: "Plataforma" }),
		descripcion: z.string().openapi({ example: "" }),
		color: z.string().openapi({ example: "#6366f1" }),
		liderId: z.number().int().nullable().openapi({ example: 3 }),
		miembros: z.array(
			z.object({
				usuarioId: z.number().int(),
				puedeCrearTareas: z.boolean(),
			}),
		),
		tagIds: z.array(z.number().int()),
	})
	.openapi("EquipoDto");
