import { z } from "@hono/zod-openapi";

export const feedCalendarioSchema = z.object({
	token: z
		.string()
		.regex(/^[0-9a-f]{48}$/, "Token inválido")
		.openapi({ description: "Token secreto de la suscripción" }),
});

export const suscripcionCalendarioSchema = z
	.object({
		activa: z.boolean(),
		creadaEn: z.iso.datetime().nullable(),
	})
	.openapi("SuscripcionCalendario");

export const urlCalendarioSchema = z
	.object({ url: z.url() })
	.openapi("UrlCalendario");
