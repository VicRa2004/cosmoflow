import { z } from "zod";
import type { NotaDto } from "../api/notasApi";

const idSearch = z.coerce.number().int().positive().optional().catch(undefined);

/** `?organizacionId=&proyectoId=`: notas de ese proyecto (lista y alta). */
export const contextoNotaSearch = z.object({
	organizacionId: idSearch,
	proyectoId: idSearch,
});

export type ContextoNotaSearch = z.infer<typeof contextoNotaSearch>;

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
