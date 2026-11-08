import { z } from "zod";
import type { NotaDto } from "../api/notasApi";

const idSearch = z.coerce.number().int().positive().optional().catch(undefined);

/** `?organizacionId=&proyectoId=`: notas de ese proyecto (lista y alta); `carpetaId`, la carpeta abierta. */
export const contextoNotaSearch = z.object({
	organizacionId: idSearch,
	proyectoId: idSearch,
	carpetaId: idSearch,
});

export type ContextoNotaSearch = z.infer<typeof contextoNotaSearch>;

/** `/notas/enlace?titulo=`: destino de un `[[wikilink]]`. */
export const enlaceNotaSearch = contextoNotaSearch.extend({
	titulo: z.string().catch(""),
});

/** Valida lo que se escribe en el formulario y lo convierte al cuerpo de la API. */
export const notaFormSchema = z.object({
	titulo: z.string().trim().min(1, "Obligatorio").max(255, "Máximo 255"),
	// Sin transformar "" en undefined: al editar, vaciar el contenido debe guardarse.
	contenido: z.string(),
	// "" = sin color: se envía `null` para quitarlo.
	color: z.string().transform((v) => v || null),
	tagIds: z.array(z.number()),
	// "" = en la raíz.
	carpetaId: z.string().transform((v) => (v ? Number(v) : null)),
});

export type NotaFormValues = z.input<typeof notaFormSchema>;

export const notaFormVacio: NotaFormValues = {
	titulo: "",
	contenido: "",
	color: "",
	tagIds: [],
	carpetaId: "",
};

export const notaAFormValues = (dto: NotaDto): NotaFormValues => ({
	titulo: dto.titulo,
	contenido: dto.contenido,
	color: dto.color ?? "",
	tagIds: dto.tagIds,
	carpetaId: dto.carpetaId ? String(dto.carpetaId) : "",
});
