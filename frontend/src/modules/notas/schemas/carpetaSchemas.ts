import { z } from "zod";
import type { CarpetaDto } from "../api/notasApi";

/** Emojis sugeridos; se puede escribir cualquier otro. */
export const ICONOS_CARPETA = [
	"📁",
	"📂",
	"🗂️",
	"📚",
	"📝",
	"💡",
	"⭐",
	"🎯",
	"💼",
	"🏠",
	"✈️",
	"🎨",
	"🔬",
	"💰",
	"❤️",
	"🧠",
];

export const carpetaFormSchema = z.object({
	nombre: z.string().trim().min(1, "Obligatorio").max(120, "Máximo 120"),
	// "" = sin icono / sin color / en la raíz: se envía `null`.
	icono: z
		.string()
		.trim()
		.max(16, "Máximo 16 caracteres")
		.transform((v) => v || null),
	color: z.string().transform((v) => v || null),
	padreId: z.string().transform((v) => (v ? Number(v) : null)),
});

export type CarpetaFormValues = z.input<typeof carpetaFormSchema>;

export const carpetaAFormValues = (
	carpeta: CarpetaDto | undefined,
	padreId: number | null,
): CarpetaFormValues => ({
	nombre: carpeta?.nombre ?? "",
	icono: carpeta?.icono ?? "",
	color: carpeta?.color ?? "",
	padreId: String((carpeta ? carpeta.padreId : padreId) ?? ""),
});
