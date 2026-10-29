import { z } from "zod";
import type { TagDto } from "../api/tagsApi";

/** Valida lo que se escribe en el formulario y lo convierte al cuerpo de la API. */
export const tagFormSchema = z.object({
	nombre: z
		.string()
		.trim()
		.min(1, "Obligatorio")
		.max(64, "Máximo 64 caracteres"),
});

export type TagFormValues = z.input<typeof tagFormSchema>;

export const tagFormVacio: TagFormValues = {
	nombre: "",
};

export const tagAFormValues = (dto: TagDto): TagFormValues => ({
	nombre: dto.nombre ?? "",
});
