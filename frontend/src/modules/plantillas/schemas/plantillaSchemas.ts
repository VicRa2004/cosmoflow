import { z } from "zod";
import { prioridades } from "@/modules/tareas/schemas/tareaSchemas";
import type { PlantillaTareaDto } from "../api/plantillasApi";

const texto = (max: number) =>
	z.string().trim().min(1, "Obligatorio").max(max, `Máximo ${max}`);

/** Valida la edición de una plantilla y la convierte al cuerpo del PUT. */
export const editarPlantillaFormSchema = z.object({
	nombre: texto(100),
	titulo: texto(255),
	contenido: z.string(),
	prioridad: z.enum(prioridades),
	// "" = sin color: `null` lo quita.
	color: z.string().transform((v) => v || null),
	// Se edita con SubtareasField (con `completada`); la plantilla solo guarda títulos.
	subtareas: z
		.array(z.object({ titulo: z.string(), completada: z.boolean() }))
		.transform((lista) =>
			lista.map((s) => s.titulo.trim()).filter((titulo) => titulo.length > 0),
		),
});

export type EditarPlantillaFormValues = z.input<
	typeof editarPlantillaFormSchema
>;

export const plantillaAEdicion = (
	p: PlantillaTareaDto,
): EditarPlantillaFormValues => ({
	nombre: p.nombre,
	titulo: p.titulo,
	contenido: p.contenido,
	prioridad: p.prioridad,
	color: p.color ?? "",
	subtareas: p.subtareas.map((titulo) => ({ titulo, completada: false })),
});
