import { z } from "zod";
import type { TagDto } from "../api/tagsApi";

/** Valida lo que se escribe en el formulario y lo convierte al cuerpo de la API. */
export const tagFormSchema = z.object({
	nombre: z
		.string()
		.trim()
		.min(1, "Obligatorio")
		.max(64, "Máximo 64 caracteres"),
	// "" = sin color: se envía `null` para quitarlo.
	color: z.string().transform((v) => v || null),
});

export type TagFormValues = z.input<typeof tagFormSchema>;

export const tagFormVacio: TagFormValues = {
	nombre: "",
	color: "",
};

export const tagAFormValues = (dto: TagDto): TagFormValues => ({
	nombre: dto.nombre ?? "",
	color: dto.color ?? "",
});
