import { z } from "@hono/zod-openapi";

const nombre = z
	.string()
	.trim()
	.min(1, "El nombre es obligatorio")
	.max(100, "Máximo 100 caracteres");
const descripcion = z.string().trim().max(500, "Máximo 500 caracteres");
const color = z
	.string()
	.regex(/^#[0-9a-fA-F]{6}$/, "El color debe ser hexadecimal (#rrggbb)")
	.transform((c) => c.toLowerCase());

export const crearOrganizacionSchema = z.object({
	nombre,
	descripcion: descripcion.optional().default(""),
	color,
});

export const actualizarOrganizacionSchema = z.object({
	nombre: nombre.optional(),
	descripcion: descripcion.optional(),
	color: color.optional(),
});

export const organizacionIdSchema = z.object({
	id: z
		.string()
		.regex(/^\d+$/, "El ID debe ser un número válido")
		.transform(Number),
});

export const obtenerOrganizacionesSchema = z.object({
	pagina: z.string().regex(/^\d+$/).transform(Number).optional().default(1),
	limite: z.string().regex(/^\d+$/).transform(Number).optional().default(10),
	nombre: z.string().trim().min(1).max(128).optional(),
});

// ── Respuestas (sólo documentación OpenAPI) ──────────────────────────────────

export const organizacionDtoSchema = z
	.object({
		id: z.number().int().openapi({ example: 1 }),
		nombre: z.string().openapi({ example: "Acme" }),
		descripcion: z.string().openapi({ example: "Equipo de producto" }),
		color: z.string().openapi({ example: "#6366f1" }),
		avatarUrl: z.string().nullable().openapi({
			example: "/api/organizaciones/1/avatar?v=organizaciones%2F1-abc.png",
		}),
		isAdmin: z.boolean().openapi({ example: true }),
		permisos: z
			.array(z.string())
			.openapi({ example: ["organizacion:editar", "miembros:invitar"] }),
	})
	.openapi("OrganizacionDto");

export const organizacionPaginaSchema = z.object({
	datos: z.array(organizacionDtoSchema),
	pagina: z.number().int().openapi({ example: 1 }),
	totalElementos: z.number().int().openapi({ example: 10 }),
	totalPaginas: z.number().int().openapi({ example: 1 }),
});
