import { z } from "@hono/zod-openapi";

export const crearTokenPersonalSchema = z.object({
	nombre: z
		.string()
		.trim()
		.min(1, "El nombre es obligatorio")
		.max(100, "Máximo 100 caracteres")
		.openapi({ example: "Claude Code" }),
});

export const tokenPersonalIdSchema = z.object({
	id: z
		.string()
		.regex(/^\d+$/, "El ID debe ser un número válido")
		.transform(Number),
});

// ── Respuestas (sólo documentación OpenAPI) ──────────────────────────────────

export const tokenPersonalDtoSchema = z
	.object({
		id: z.number().int().openapi({ example: 1 }),
		nombre: z.string().openapi({ example: "Claude Code" }),
		pista: z.string().openapi({ example: "a1b2" }),
		createdAt: z.iso.datetime().openapi({ example: "2026-11-04T10:00:00Z" }),
	})
	.openapi("TokenPersonalDto");

export const tokenPersonalCreadoSchema = tokenPersonalDtoSchema
	.extend({
		token: z.string().openapi({ description: "Solo se devuelve aquí" }),
	})
	.openapi("TokenPersonalCreado");
