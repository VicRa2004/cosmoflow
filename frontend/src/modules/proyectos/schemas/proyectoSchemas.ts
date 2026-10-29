import { z } from "zod";
import type { EstadoProyecto, ProyectoDto } from "../api/proyectosApi";

export const ETIQUETA_ESTADO: Record<EstadoProyecto, string> = {
	activo: "Activo",
	en_pausa: "En pausa",
	terminado: "Terminado",
};

/** Valida el formulario y lo convierte al cuerpo de la API (RN-31, 32). */
export const proyectoFormSchema = z.object({
	nombre: z
		.string()
		.trim()
		.min(1, "Obligatorio")
		.max(100, "Máximo 100 caracteres"),
	descripcion: z.string().trim().max(500, "Máximo 500 caracteres"),
	estado: z.enum(["activo", "en_pausa", "terminado"]),
	equipoIds: z.array(z.number()).min(1, "Elige al menos un equipo"),
	integranteIds: z.array(z.number()),
});

export type ProyectoFormValues = z.input<typeof proyectoFormSchema>;

export const proyectoAFormValues = (
	proyecto?: ProyectoDto,
): ProyectoFormValues => ({
	nombre: proyecto?.nombre ?? "",
	descripcion: proyecto?.descripcion ?? "",
	estado: proyecto?.estado ?? "activo",
	equipoIds: proyecto?.equipoIds ?? [],
	integranteIds: proyecto?.integranteIds ?? [],
});
