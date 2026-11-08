import { z } from "@hono/zod-openapi";
import { colorAcentoSchema } from "@/core/shared/infrastructure/http/openapi";

const campos = {
	nombre: z
		.string()
		.trim()
		.min(1, "El nombre es obligatorio")
		.max(120, "Máximo 120 caracteres"),
	icono: z
		.string()
		.trim()
		.min(1)
		.max(16, "Máximo 16 caracteres")
		.nullable()
		.openapi({ example: "📁" }),
	color: colorAcentoSchema,
	/** `null`, en la raíz. */
	padreId: z.number().int().positive().nullable(),
};

/** Sin `proyectoId`, personal (RN-50). */
export const crearCarpetaSchema = z.object({
	nombre: campos.nombre,
	icono: campos.icono.optional(),
	color: campos.color.optional(),
	padreId: campos.padreId.optional(),
	proyectoId: z.number().int().positive().optional(),
});

export const actualizarCarpetaSchema = z.object(campos).partial();

export const carpetaIdSchema = z.object({
	id: z
		.string()
		.regex(/^\d+$/, "El ID debe ser un número válido")
		.transform(Number),
});

export const obtenerCarpetasSchema = z.object({
	/** Sin él, las personales. */
	proyectoId: z.string().regex(/^\d+$/).transform(Number).optional(),
});

export const carpetaDtoSchema = z
	.object({
		id: z.number().int().openapi({ example: 1 }),
		nombre: z.string().openapi({ example: "Viajes" }),
		icono: z.string().nullable().openapi({ example: "✈️" }),
		color: colorAcentoSchema,
		padreId: z.number().int().nullable(),
		organizacionId: z.number().int().nullable(),
		proyectoId: z.number().int().nullable(),
	})
	.openapi("CarpetaDto");
