import { z } from "zod";
import type { EquipoDto } from "../api/equiposApi";

/** Valida el formulario y lo convierte al cuerpo de la API (RN-20, 21, 24). */
export const equipoFormSchema = z
	.object({
		nombre: z
			.string()
			.trim()
			.min(1, "Obligatorio")
			.max(100, "Máximo 100 caracteres"),
		descripcion: z.string().trim().max(500, "Máximo 500 caracteres"),
		color: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Color no válido"),
		miembroIds: z.array(z.number()).min(2, "Elige al menos 2 miembros"),
		liderId: z.number().nullable(),
		tagIds: z.array(z.number()),
	})
	.refine((v) => v.liderId === null || v.miembroIds.includes(v.liderId), {
		message: "El líder debe ser miembro del equipo",
		path: ["liderId"],
	});

export type EquipoFormValues = z.input<typeof equipoFormSchema>;

export const equipoAFormValues = (equipo?: EquipoDto): EquipoFormValues => ({
	nombre: equipo?.nombre ?? "",
	descripcion: equipo?.descripcion ?? "",
	color: equipo?.color ?? "#6366f1",
	miembroIds: equipo?.miembros.map((m) => m.usuarioId) ?? [],
	liderId: equipo?.liderId ?? null,
	tagIds: equipo?.tagIds ?? [],
});
