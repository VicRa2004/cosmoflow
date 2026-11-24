import { z } from "@hono/zod-openapi";

export const eliminarCuentaSchema = z.object({
	password: z.string().min(1, "La contraseña es obligatoria"),
});

const fecha = z.iso.datetime().nullable();

const tareaExportadaSchema = z.object({
	id: z.number().int(),
	titulo: z.string(),
	contenido: z.string(),
	estado: z.string(),
	prioridad: z.string(),
	fechaInicio: fecha,
	fechaVencimiento: fecha,
	organizacionId: z.number().int().nullable(),
	equipoId: z.number().int().nullable(),
	proyectoId: z.number().int().nullable(),
	subtareas: z.array(z.object({ titulo: z.string(), completada: z.boolean() })),
	createdAt: z.iso.datetime(),
	updatedAt: fecha,
});

const notaExportadaSchema = z.object({
	id: z.number().int(),
	titulo: z.string(),
	contenido: z.string(),
	carpetaId: z.number().int().nullable(),
	organizacionId: z.number().int().nullable(),
	proyectoId: z.number().int().nullable(),
	createdAt: z.iso.datetime(),
	updatedAt: z.iso.datetime(),
});

export const datosExportadosSchema = z
	.object({
		tareas: z.array(tareaExportadaSchema),
		notas: z.array(notaExportadaSchema),
		carpetas: z.array(
			z.object({
				id: z.number().int(),
				nombre: z.string(),
				padreId: z.number().int().nullable(),
			}),
		),
	})
	.openapi("DatosExportados");
