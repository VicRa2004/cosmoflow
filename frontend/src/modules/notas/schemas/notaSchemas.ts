import { z } from "zod";
import type { NotaDto } from "../api/notasApi";

/** Valida lo que se escribe en el formulario y lo convierte al cuerpo de la API. */
export const notaFormSchema = z.object({
	titulo: z.string().trim().min(1, "Obligatorio").max(255, "Máximo 255"),
	// Sin transformar "" en undefined: al editar, vaciar el contenido debe guardarse.
	contenido: z.string(),
	tagIds: z.array(z.number()),
});

export type NotaFormValues = z.input<typeof notaFormSchema>;

export const notaFormVacio: NotaFormValues = {
	titulo: "",
	contenido: "",
	tagIds: [],
};

export const notaAFormValues = (dto: NotaDto): NotaFormValues => ({
	titulo: dto.titulo,
	contenido: dto.contenido,
	tagIds: dto.tagIds,
});
