import { z } from "zod";
import type { EstadoProyecto, ProyectoDto } from "../api/proyectosApi";

export const ETIQUETA_ESTADO: Record<EstadoProyecto, string> = {
	activo: "Activo",
	en_pausa: "En pausa",
	terminado: "Terminado",
};

/** `<input type="date">` da "" o `AAAA-MM-DD`; "" vacía la fecha. */
const dia = z.string().transform((v) => v || null);

/** Valida el formulario y lo convierte al cuerpo de la API (RN-31, 32). */
export const proyectoFormSchema = z
	.object({
		nombre: z
			.string()
			.trim()
			.min(1, "Obligatorio")
			.max(100, "Máximo 100 caracteres"),
		descripcion: z.string().trim().max(500, "Máximo 500 caracteres"),
		estado: z.enum(["activo", "en_pausa", "terminado"]),
		// "" = sin color: se envía `null` para quitarlo.
		color: z.string().transform((v) => v || null),
		fechaInicio: dia,
		fechaFin: dia,
		equipoIds: z.array(z.number()),
		integranteIds: z.array(z.number()),
	})
	.refine((d) => !d.fechaInicio || !d.fechaFin || d.fechaInicio <= d.fechaFin, {
		message: "Debe ser igual o posterior al inicio",
		path: ["fechaFin"],
	})
	.refine((d) => d.equipoIds.length + d.integranteIds.length > 0, {
		message: "Elige al menos un equipo o una persona",
		path: ["integranteIds"],
	});

export type ProyectoFormValues = z.input<typeof proyectoFormSchema>;

export const proyectoAFormValues = (
	proyecto?: ProyectoDto,
): ProyectoFormValues => ({
	nombre: proyecto?.nombre ?? "",
	descripcion: proyecto?.descripcion ?? "",
	estado: proyecto?.estado ?? "activo",
	color: proyecto?.color ?? "",
	fechaInicio: proyecto?.fechaInicio ?? "",
	fechaFin: proyecto?.fechaFin ?? "",
	equipoIds: proyecto?.equipoIds ?? [],
	integranteIds: proyecto?.integranteIds ?? [],
});
