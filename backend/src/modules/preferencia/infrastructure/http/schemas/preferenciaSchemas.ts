import { z } from "@hono/zod-openapi";
import {
	COLORES_MARKDOWN,
	ESCALAS,
	FUENTES_MARKDOWN,
	INTERLINEADOS,
} from "../../../domain/PreferenciasInterfaz";

export const preferenciasInterfazSchema = z
	.object({
		tamanoInterfaz: z.enum(ESCALAS),
		markdownFuente: z.enum(FUENTES_MARKDOWN),
		markdownTamano: z.enum(ESCALAS),
		markdownInterlineado: z.enum(INTERLINEADOS),
		markdownColor: z.enum(COLORES_MARKDOWN),
		pendientesNotas: z.boolean(),
		pendientesOrganizaciones: z.number().int().min(1).max(50).nullable(),
	})
	.openapi("PreferenciasInterfaz");

/** Solo las que cambian; una clave desconocida es un error. */
export const actualizarPreferenciasInterfazSchema = preferenciasInterfazSchema
	.partial()
	.strict();
