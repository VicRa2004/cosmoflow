import { z } from "@hono/zod-openapi";
import { colorAcentoSchema } from "@/core/shared/infrastructure/http/openapi";
import { PRIORIDADES_TAREA } from "../../../domain/Tarea";

const texto = (max: number, obligatorio: string) =>
	z.string().trim().min(1, obligatorio).max(max, `Máximo ${max} caracteres`);

const campos = {
	nombre: texto(100, "El nombre es obligatorio"),
	titulo: texto(255, "El título es obligatorio"),
	contenido: z.string().max(100_000, "Contenido demasiado largo"),
	prioridad: z.enum(PRIORIDADES_TAREA),
	// `null`: sin color.
	color: colorAcentoSchema,
	subtareas: z
		.array(texto(255, "El título de la subtarea es obligatorio"))
		.max(100),
};

export const crearPlantillaSchema = z.object({
	...campos,
	contenido: campos.contenido.default(""),
	prioridad: campos.prioridad.default("media"),
	color: campos.color.default(null),
	subtareas: campos.subtareas.default([]),
});

export const actualizarPlantillaSchema = z.object(campos).partial();

const idParam = z
	.string()
	.regex(/^\d+$/, "El ID debe ser un número válido")
	.transform(Number);

export const plantillaIdSchema = z.object({ id: idParam });

/** Montado en `/api/organizaciones/{organizacionId}/plantillas` llega el id; en `/api/plantillas`, no. */
export const ambitoPlantillaSchema = z.object({
	organizacionId: idParam.optional(),
});

export const organizacionIdParamSchema = z.object({ organizacionId: idParam });

export const plantillaDtoSchema = z
	.object({ id: z.number().int().openapi({ example: 1 }), ...campos })
	.openapi("PlantillaTareaDto");
