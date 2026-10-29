import { z } from "@hono/zod-openapi";
import { ESTADOS_PROYECTO } from "../../../domain/Proyecto";

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
const estado = z.enum(ESTADOS_PROYECTO).openapi("EstadoProyecto");
const ids = z.array(z.number().int().positive()).max(500);
const equipoIds = ids.min(1, "Un proyecto necesita al menos un equipo");

export const organizacionIdParamSchema = z.object({ organizacionId: idParam });
export const proyectoParamsSchema = organizacionIdParamSchema.extend({
	id: idParam,
});

export const crearProyectoSchema = z.object({
	nombre,
	descripcion: descripcion.optional().default(""),
	estado: estado.optional().default("activo"),
	equipoIds,
	integranteIds: ids.optional().default([]),
});

export const actualizarProyectoSchema = z.object({
	nombre: nombre.optional(),
	descripcion: descripcion.optional(),
	estado: estado.optional(),
	equipoIds: equipoIds.optional(),
	integranteIds: ids.optional(),
});

export const obtenerProyectosSchema = z.object({ estado: estado.optional() });

// ── Respuestas (sólo documentación OpenAPI) ──────────────────────────────────

export const proyectoDtoSchema = z
	.object({
		id: z.number().int().openapi({ example: 1 }),
		nombre: z.string().openapi({ example: "Lanzamiento v2" }),
		descripcion: z.string().openapi({ example: "" }),
		estado,
		equipoIds: z.array(z.number().int()),
		integranteIds: z.array(z.number().int()),
	})
	.openapi("ProyectoDto");
