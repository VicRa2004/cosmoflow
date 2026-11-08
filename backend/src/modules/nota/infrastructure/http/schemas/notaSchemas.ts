import { z } from "@hono/zod-openapi";
import { colorAcentoSchema } from "@/core/shared/infrastructure/http/openapi";

const campos = {
	titulo: z
		.string()
		.trim()
		.min(1, "El título es obligatorio")
		.max(255, "Máximo 255 caracteres"),
	contenido: z.string().max(100_000, "Contenido demasiado largo").optional(),
	color: colorAcentoSchema.optional(),
	tagIds: z.array(z.number().int().positive()).max(50).optional(),
	/** `null` la saca a la raíz. */
	carpetaId: z.number().int().positive().nullable().optional(),
};

/** Sin `proyectoId`, personal (RN-50). */
export const crearNotaSchema = z.object({
	...campos,
	proyectoId: z.number().int().positive().optional(),
});

export const actualizarNotaSchema = z.object(campos).partial();

export const notaIdSchema = z.object({
	id: z
		.string()
		.regex(/^\d+$/, "El ID debe ser un número válido")
		.transform(Number),
});

const numero = z.string().regex(/^\d+$/).transform(Number);
const fecha = z.iso
	.datetime({ offset: true })
	.transform((iso) => new Date(iso))
	.openapi({ example: "2026-10-28T06:00:00.000Z" });

export const obtenerNotasSchema = z.object({
	pagina: numero.optional().default(1),
	limite: numero.optional().default(10),
	busqueda: z.string().trim().min(1).max(128).optional(),
	tagId: numero.optional(),
	/** Solo las que están directamente en esa carpeta. */
	carpetaId: numero.optional(),
	/** Título exacto sin distinguir mayúsculas (wikilinks). */
	titulo: z.string().trim().min(1).max(255).optional(),
	creadaDesde: fecha.optional(),
	creadaHasta: fecha.optional(),
	editadaDesde: fecha.optional(),
	editadaHasta: fecha.optional(),
	/** Sin él, las personales. */
	proyectoId: numero.optional(),
});

/** Ruta de carpetas desde el destino; sin `proyectoId`, personales. */
export const importarNotasSchema = z.object({
	proyectoId: z.number().int().positive().optional(),
	carpetaId: z.number().int().positive().optional(),
	notas: z
		.array(
			z.object({
				carpeta: z
					.array(z.string().trim().min(1).max(120))
					.max(20)
					.openapi({ example: ["Viajes", "Europa"] }),
				titulo: campos.titulo,
				contenido: z.string().max(100_000, "Contenido demasiado largo"),
			}),
		)
		// shortcut: un lote por petición; el cliente trocea vaults más grandes.
		.min(1)
		.max(200),
});

// ── Respuestas (sólo documentación OpenAPI) ──────────────────────────────────

export const notaDtoSchema = z
	.object({
		id: z.number().int().openapi({ example: 1 }),
		titulo: z.string().openapi({ example: "Ideas para el viaje" }),
		contenido: z.string().openapi({ example: "## Lugares\n- Lisboa" }),
		color: colorAcentoSchema,
		tagIds: z.array(z.number().int()),
		organizacionId: z.number().int().nullable(),
		proyectoId: z.number().int().nullable(),
		carpetaId: z.number().int().nullable(),
		updatedAt: z.iso.datetime().openapi({ example: "2026-10-28T10:00:00Z" }),
		createdAt: z.iso.datetime().openapi({ example: "2026-10-27T10:00:00Z" }),
	})
	.openapi("NotaDto");

export const resultadoImportacionSchema = z
	.object({
		notas: z.number().int().openapi({ example: 12 }),
		carpetas: z.number().int().openapi({ example: 3 }),
	})
	.openapi("ResultadoImportacionDto");

export const notaPaginaSchema = z.object({
	datos: z.array(notaDtoSchema),
	pagina: z.number().int().openapi({ example: 1 }),
	totalElementos: z.number().int().openapi({ example: 10 }),
	totalPaginas: z.number().int().openapi({ example: 1 }),
});
