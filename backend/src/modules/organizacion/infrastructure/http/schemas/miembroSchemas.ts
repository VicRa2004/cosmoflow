import { z } from "@hono/zod-openapi";

const id = z
	.string()
	.regex(/^\d+$/, "El ID debe ser un número válido")
	.transform(Number);

export const miembroParamsSchema = z.object({ id, usuarioId: id });

export const delegarSchema = z.object({
	usuarioId: z.number().int().positive(),
});

// ── Respuestas (sólo documentación OpenAPI) ──────────────────────────────────

export const miembroDtoSchema = z
	.object({
		usuarioId: z.number().int().openapi({ example: 2 }),
		nombre: z.string().openapi({ example: "Beto" }),
		email: z.string().openapi({ example: "beto@ejemplo.com" }),
		avatarUrl: z.string().nullable().openapi({ example: null }),
		isAdmin: z.boolean().openapi({ example: false }),
		roles: z.array(z.object({ id: z.number().int(), nombre: z.string() })),
		createdAt: z.string().openapi({ example: "2026-10-29T12:00:00.000Z" }),
	})
	.openapi("MiembroDto");
