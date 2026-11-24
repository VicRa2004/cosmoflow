import { z } from "@hono/zod-openapi";
import { usuarioDtoSchema } from "@/core/usuario";

const passwordSchema = z
	.string("La contraseña es obligatoria")
	.min(12, "La contraseña debe tener al menos 12 caracteres")
	.regex(/[A-Z]/, "La contraseña debe incluir al menos una mayúscula")
	.regex(/[a-z]/, "La contraseña debe incluir al menos una minúscula")
	.regex(/[0-9]/, "La contraseña debe incluir al menos un número")
	.regex(
		/[^A-Za-z0-9]/,
		"La contraseña debe incluir al menos un carácter especial",
	);

export const loginSchema = z.object({
	email: z.email("El email es obligatorio y debe ser válido"),
	password: z.string().min(1, "La contraseña es obligatoria"),
});

export const registroSchema = z.object({
	nombre: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
	email: z.email("El email es obligatorio y debe ser válido"),
	password: passwordSchema,
});

export const recuperarPasswordSchema = z.object({
	email: z.email("El email es obligatorio y debe ser válido"),
});

const tokenCuentaSchema = z.string().min(1, "El token es obligatorio").max(256);

export const restablecerPasswordSchema = z.object({
	token: tokenCuentaSchema,
	password: passwordSchema,
});

export const verificarEmailSchema = z.object({ token: tokenCuentaSchema });

export const cambiarPasswordSchema = z.object({
	passwordActual: z.string().min(1, "La contraseña actual es obligatoria"),
	passwordNueva: passwordSchema,
});

const codigoTotpSchema = z
	.string("El código es obligatorio")
	.trim()
	.regex(/^\d{6}$/, "El código tiene 6 dígitos");

/** Código de la app (6 dígitos) o de recuperación (`xxxxx-xxxxx`). */
const codigoDosPasosSchema = z
	.string("El código es obligatorio")
	.trim()
	.min(6, "El código es obligatorio")
	.max(20, "Código inválido");

export const loginDosPasosSchema = z.object({
	tokenDosPasos: z.string().min(1, "El token es obligatorio").max(1024),
	codigo: codigoDosPasosSchema,
});

export const activarDosPasosSchema = z.object({ codigo: codigoTotpSchema });

export const desactivarDosPasosSchema = z
	.object({
		password: z.string().min(1).optional(),
		codigo: codigoDosPasosSchema.optional(),
	})
	.refine((d) => d.password || d.codigo, {
		message: "Indica tu contraseña o un código",
	});

export const refreshTokenSchema = z.object({
	refreshToken: z.string().min(1, "El refresh token es obligatorio"),
});

export const sesionIdSchema = z.object({
	id: z
		.string()
		.regex(/^\d+$/, "El ID debe ser un número válido")
		.transform(Number),
});

// ── Respuestas (sólo documentación OpenAPI) ──────────────────────────────────

const accessTokenSchema = z
	.string()
	.openapi({ example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." });

// Web: viaja en la cookie httpOnly y no aparece aquí.
const refreshTokenMovilSchema = z.string().optional().openapi({
	description:
		"Sólo con `X-Client-Platform: mobile` (y sin cookie): el refresh token, que la app reenvía en `X-Refresh-Token`.",
});

export const authResponseSchema = z
	.object({
		accessToken: accessTokenSchema,
		usuario: usuarioDtoSchema,
		refreshToken: refreshTokenMovilSchema,
	})
	.openapi("AuthResponse");

export const dosPasosRequeridoSchema = z
	.object({
		requiereDosPasos: z.literal(true),
		tokenDosPasos: z.string().openapi({
			description:
				"Token intermedio (5 min): se canjea con el código en `POST /api/auth/login/dos-pasos`.",
		}),
	})
	.openapi("DosPasosRequerido");

export const dosPasosEstadoSchema = z
	.object({
		isActivo: z.boolean(),
		codigosRestantes: z.number().int().openapi({ example: 10 }),
	})
	.openapi("DosPasosEstado");

export const iniciarDosPasosResponseSchema = z.object({
	secreto: z.string().openapi({ example: "JBSWY3DPEHPK3PXPJBSWY3DPEHPK3PXP" }),
	uri: z.string().openapi({ description: "URI `otpauth://` para el QR" }),
});

export const codigosRecuperacionResponseSchema = z.object({
	codigosRecuperacion: z.array(z.string()).openapi({
		description: "Códigos de un solo uso: solo se muestran ahora",
	}),
});

export const refreshResponseSchema = z.object({
	accessToken: accessTokenSchema,
	refreshToken: refreshTokenMovilSchema,
});

export const mensajeResponseSchema = z.object({
	mensaje: z.string().openapi({ example: "Sesión cerrada correctamente" }),
});

export const sesionDtoSchema = z
	.object({
		id: z.number().int().openapi({ example: 12 }),
		createdAt: z.iso.datetime(),
		expiraEn: z.iso.datetime(),
		isActual: z.boolean().openapi({ example: true }),
	})
	.openapi("SesionDto");
