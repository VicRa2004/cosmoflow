import { z } from "@hono/zod-openapi";
import { ESTADOS_TAREA, PRIORIDADES_TAREA } from "../../../domain/Tarea";

const dia = z.iso
	.date("Fecha inválida (formato AAAA-MM-DD)")
	.nullable()
	.openapi({ example: "2026-11-15" });

const campos = {
	titulo: z
		.string()
		.trim()
		.min(1, "El título es obligatorio")
		.max(255, "Máximo 255 caracteres"),
	contenido: z.string().max(100_000, "Contenido demasiado largo").optional(),
	estado: z.enum(ESTADOS_TAREA).optional(),
	prioridad: z.enum(PRIORIDADES_TAREA).optional(),
	fechaInicio: dia.optional(),
	fechaVencimiento: dia.optional(),
	tagIds: z.array(z.number().int().positive()).max(50).optional(),
};

export const crearTareaSchema = z.object(campos);

export const actualizarTareaSchema = z.object(campos).partial();

export const tareaIdSchema = z.object({
	id: z
		.string()
		.regex(/^\d+$/, "El ID debe ser un número válido")
		.transform(Number),
});

const numero = z.string().regex(/^\d+$/).transform(Number);

export const obtenerTareasSchema = z.object({
	pagina: numero.optional().default(1),
	limite: numero.optional().default(10),
	busqueda: z.string().trim().min(1).max(128).optional(),
	estado: z.enum(ESTADOS_TAREA).optional(),
	tagId: numero.optional(),
});

// ── Respuestas (sólo documentación OpenAPI) ──────────────────────────────────

export const tareaDtoSchema = z
	.object({
		id: z.number().int().openapi({ example: 1 }),
		titulo: z.string().openapi({ example: "Preparar la demo" }),
		contenido: z.string().openapi({ example: "- [ ] Diapositivas" }),
		estado: z.enum(ESTADOS_TAREA),
		prioridad: z.enum(PRIORIDADES_TAREA),
		fechaInicio: dia,
		fechaVencimiento: dia,
		tagIds: z.array(z.number().int()),
	})
	.openapi("TareaDto");

export const tareaPaginaSchema = z.object({
	datos: z.array(tareaDtoSchema),
	pagina: z.number().int().openapi({ example: 1 }),
	totalElementos: z.number().int().openapi({ example: 10 }),
	totalPaginas: z.number().int().openapi({ example: 1 }),
});
