import { z } from "@hono/zod-openapi";
import { ALCANCES } from "../../../domain/alcances";

const alcances = z
	.array(z.enum(ALCANCES).openapi("AlcanceToken"))
	.min(1, "Elige al menos un permiso")
	.max(ALCANCES.length)
	.transform((lista) => [...new Set(lista)])
	.nullable()
	.openapi({
		description: "Escribir incluye leer; null = acceso completo",
		example: ["tareas:leer", "notas:leer"],
	});

export const crearTokenPersonalSchema = z.object({
	nombre: z
		.string()
		.trim()
		.min(1, "El nombre es obligatorio")
		.max(100, "Máximo 100 caracteres")
		.openapi({ example: "Claude Code" }),
	alcances: alcances.optional().default(null),
});

export const cambiarAlcancesSchema = z.object({ alcances });

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
		ultimoUsoEn: z.iso.datetime().nullable().openapi({
			description: "Con precisión de minutos; null si no se ha usado",
		}),
		esConexion: z.boolean().openapi({
			description: "Conexión OAuth (p. ej. Claude) en vez de un token a mano",
		}),
		alcances: z.array(z.enum(ALCANCES)).nullable().openapi({
			description: "null = acceso completo",
		}),
	})
	.openapi("TokenPersonalDto");

export const tokenPersonalCreadoSchema = tokenPersonalDtoSchema
	.extend({
		token: z.string().openapi({ description: "Solo se devuelve aquí" }),
	})
	.openapi("TokenPersonalCreado");
