import { z } from "@hono/zod-openapi";

const id = z
	.string()
	.regex(/^\d+$/, "El ID debe ser un número válido")
	.transform(Number);

export const invitacionParamsSchema = z.object({ id, invitacionId: id });

export const invitarSchema = z.object({
	email: z
		.email("El email es obligatorio y debe ser válido")
		.max(128)
		.transform((email) => email.toLowerCase()),
});

export const tokenInvitacionSchema = z.object({
	token: z.string().regex(/^[a-f0-9]{64}$/, "Enlace de invitación no válido"),
});

// ── Respuestas (sólo documentación OpenAPI) ──────────────────────────────────

export const invitacionDtoSchema = z
	.object({
		id: z.number().int().openapi({ example: 1 }),
		email: z.string().openapi({ example: "beto@ejemplo.com" }),
		expiraEn: z.string().openapi({ example: "2026-11-05T12:00:00.000Z" }),
		isCaducada: z.boolean().openapi({ example: false }),
		createdAt: z.string().openapi({ example: "2026-10-29T12:00:00.000Z" }),
	})
	.openapi("InvitacionDto");

export const invitacionRecibidaDtoSchema = z
	.object({
		nombreOrganizacion: z.string().openapi({ example: "Acme" }),
		email: z.string().openapi({ example: "beto@ejemplo.com" }),
		isVigente: z.boolean().openapi({ example: true }),
	})
	.openapi("InvitacionRecibidaDto");

export const respuestaInvitacionSchema = z
	.object({ organizacionId: z.number().int().openapi({ example: 1 }) })
	.openapi("RespuestaInvitacionDto");
