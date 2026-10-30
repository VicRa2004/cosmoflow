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
	/** Solo en las compartidas (RN-44). */
	responsableIds: z.array(z.number().int().positive()).max(50).optional(),
};

const id = z.number().int().positive();
const unSoloDestino = {
	message:
		"Una tarea es de la organización, de un equipo o de un proyecto: solo uno",
	path: ["proyectoId"],
};
const sinDosDestinos = (v: {
	organizacionId?: unknown;
	equipoId?: unknown;
	proyectoId?: unknown;
}) =>
	[v.organizacionId, v.equipoId, v.proyectoId].filter((d) => d !== undefined)
		.length <= 1;

/** Sin destino, personal; `organizacionId` solo, de la organización. */
export const crearTareaSchema = z
	.object({
		...campos,
		organizacionId: id.optional(),
		equipoId: id.optional(),
		proyectoId: id.optional(),
	})
	.refine(sinDosDestinos, unSoloDestino);

export const actualizarTareaSchema = z.object(campos).partial();

/** RN-45: de personal a la organización, a un equipo o a un proyecto. */
export const moverTareaSchema = z.union([
	z.object({ organizacionId: id }).strict(),
	z.object({ equipoId: id }).strict(),
	z.object({ proyectoId: id }).strict(),
]);

export const tareaIdSchema = z.object({
	id: z
		.string()
		.regex(/^\d+$/, "El ID debe ser un número válido")
		.transform(Number),
});

const numero = z.string().regex(/^\d+$/).transform(Number);

export const paginacionSchema = z.object({
	pagina: numero.optional().default(1),
	limite: numero.optional().default(10),
});

/**
 * Sin destino, las personales; `organizacionId` solo, las de la organización;
 * `asignadas=true`, en las que se es responsable.
 */
export const obtenerTareasSchema = paginacionSchema
	.extend({
		busqueda: z.string().trim().min(1).max(128).optional(),
		estado: z.enum(ESTADOS_TAREA).optional(),
		tagId: numero.optional(),
		organizacionId: numero.optional(),
		equipoId: numero.optional(),
		proyectoId: numero.optional(),
		asignadas: z
			.literal("true")
			.transform(() => true)
			.optional(),
	})
	.refine(sinDosDestinos, unSoloDestino)
	.refine(
		(v) =>
			!v.asignadas ||
			[v.organizacionId, v.equipoId, v.proyectoId].every(
				(d) => d === undefined,
			),
		{
			message: "`asignadas` no se combina con un destino",
			path: ["asignadas"],
		},
	);

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
		organizacionId: z.number().int().nullable(),
		equipoId: z.number().int().nullable(),
		proyectoId: z.number().int().nullable(),
		responsableIds: z.array(z.number().int()),
	})
	.openapi("TareaDto");

export const tareaPaginaSchema = z.object({
	datos: z.array(tareaDtoSchema),
	pagina: z.number().int().openapi({ example: 1 }),
	totalElementos: z.number().int().openapi({ example: 10 }),
	totalPaginas: z.number().int().openapi({ example: 1 }),
});
