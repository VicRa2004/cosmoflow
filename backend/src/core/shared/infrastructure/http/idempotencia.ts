import type { MiddlewareHandler } from "hono";
import type { ContentfulStatusCode } from "hono/utils/http-status";
import { prisma } from "@/core/config/prisma";
import type { Prisma } from "@/generated/prisma/client";
import { contexto } from "../contexto";

const CADUCA_MS = 7 * 24 * 60 * 60 * 1000;
/** Una petición «en curso» más vieja que esto se cortó a medias: el reintento la releva. */
const ABANDONADA_MS = 60 * 1000;

/**
 * Altas repetibles sin duplicar: con la cabecera `Idempotency-Key`, el reintento de
 * una petición que ya se guardó recibe la misma respuesta en lugar de crear otra.
 * Va detrás de `authMiddleware` (la clave es por usuario); sin cabecera no hace nada.
 * Solo se guardan las respuestas 2xx: tras un error se puede reintentar con la misma clave.
 */
export const idempotencia: MiddlewareHandler = async (c, next) => {
	const clave = c.req.header("Idempotency-Key");
	const { usuarioId } = contexto.actual();
	if (!clave || !usuarioId) return next();
	if (clave.length > 100) {
		return c.json(
			{ error: "Idempotency-Key admite hasta 100 caracteres" },
			400,
		);
	}
	const where = { usuarioId_clave: { usuarioId, clave } };

	const previa = await prisma.claveIdempotencia.findUnique({ where });
	if (previa?.status) {
		return c.json(previa.respuesta, previa.status as ContentfulStatusCode);
	}
	// Reservar la clave antes de ejecutar: de dos peticiones simultáneas solo pasa una.
	const reservada = previa
		? (
				await prisma.claveIdempotencia.updateMany({
					where: {
						usuarioId,
						clave,
						status: null,
						createdAt: { lt: new Date(Date.now() - ABANDONADA_MS) },
					},
					data: { createdAt: new Date() },
				})
			).count === 1
		: await prisma.claveIdempotencia
				.create({ data: { usuarioId, clave } })
				.then(() => true)
				// P2002: otra petición con la misma clave la reservó antes.
				.catch((error) => {
					if (error?.code === "P2002") return false;
					throw error;
				});
	if (!reservada) {
		return c.json({ error: "La petición original sigue en curso" }, 409);
	}

	await next();

	if (c.res.ok) {
		await prisma.claveIdempotencia.update({
			where,
			data: {
				status: c.res.status,
				respuesta: (await c.res.clone().json()) as Prisma.InputJsonValue,
			},
		});
		// Purga al paso: no hace falta una tarea programada para tan pocas filas.
		await prisma.claveIdempotencia.deleteMany({
			where: { createdAt: { lt: new Date(Date.now() - CADUCA_MS) } },
		});
	} else {
		await prisma.claveIdempotencia.delete({ where });
	}
};
