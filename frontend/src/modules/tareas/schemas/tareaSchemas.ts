import { z } from "zod";
import type { EstadoTarea, PrioridadTarea, TareaDto } from "../api/tareasApi";

export const ETIQUETAS_ESTADO: Record<EstadoTarea, string> = {
	pendiente: "Pendiente",
	en_progreso: "En progreso",
	completada: "Completada",
	cancelada: "Cancelada",
};

export const ETIQUETAS_PRIORIDAD: Record<PrioridadTarea, string> = {
	baja: "Baja",
	media: "Media",
	alta: "Alta",
};

const estados = Object.keys(ETIQUETAS_ESTADO) as [
	EstadoTarea,
	...EstadoTarea[],
];
const prioridades = Object.keys(ETIQUETAS_PRIORIDAD) as [
	PrioridadTarea,
	...PrioridadTarea[],
];

const idSearch = z.coerce.number().int().positive().optional().catch(undefined);

/**
 * `?organizacionId=&equipoId=` o `&proyectoId=`: tareas de ese equipo o proyecto
 * (lista y alta). La organización sirve para sus tags y miembros.
 */
export const contextoTareaSearch = z.object({
	organizacionId: idSearch,
	equipoId: idSearch,
	proyectoId: idSearch,
});

export type ContextoTareaSearch = z.infer<typeof contextoTareaSearch>;

/** `<input type="date">` da "" o `AAAA-MM-DD`; "" vacía la fecha. */
const dia = z.string().transform((v) => v || null);

/** Valida lo que se escribe en el formulario y lo convierte al cuerpo de la API. */
export const tareaFormSchema = z
	.object({
		titulo: z.string().trim().min(1, "Obligatorio").max(255, "Máximo 255"),
		contenido: z.string(),
		estado: z.enum(estados),
		prioridad: z.enum(prioridades),
		fechaInicio: dia,
		fechaVencimiento: dia,
		tagIds: z.array(z.number()),
		responsableIds: z.array(z.number()),
	})
	.refine(
		(t) =>
			!t.fechaInicio ||
			!t.fechaVencimiento ||
			t.fechaInicio <= t.fechaVencimiento,
		{
			message: "Debe ser igual o posterior al inicio",
			path: ["fechaVencimiento"],
		},
	);

export type TareaFormValues = z.input<typeof tareaFormSchema>;

export const tareaFormVacio: TareaFormValues = {
	titulo: "",
	contenido: "",
	estado: "pendiente",
	prioridad: "media",
	fechaInicio: "",
	fechaVencimiento: "",
	tagIds: [],
	responsableIds: [],
};

export const tareaAFormValues = (dto: TareaDto): TareaFormValues => ({
	titulo: dto.titulo,
	contenido: dto.contenido,
	estado: dto.estado,
	prioridad: dto.prioridad,
	fechaInicio: dto.fechaInicio ?? "",
	fechaVencimiento: dto.fechaVencimiento ?? "",
	tagIds: dto.tagIds,
	responsableIds: dto.responsableIds,
});
