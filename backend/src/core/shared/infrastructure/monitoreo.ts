import * as Sentry from "@sentry/bun";
import { env } from "@/core/config/env";

/**
 * Errores a Sentry o GlitchTip si hay `SENTRY_DSN`; si no, no hace nada.
 * Sin datos personales ni contenido: del usuario solo va el id y de la petición, método y ruta.
 */
export function iniciarMonitoreo() {
	if (!env.SENTRY_DSN) return;
	Sentry.init({
		dsn: env.SENTRY_DSN,
		environment: env.NODE_ENV,
		beforeSend: limpiarEvento,
	});
}

export function limpiarEvento<T extends Sentry.ErrorEvent>(evento: T): T {
	if (evento.request) {
		evento.request = {
			method: evento.request.method,
			url: evento.request.url?.split("?")[0],
		};
	}
	if (evento.user) evento.user = { id: evento.user.id };
	// Los logs de consola y las consultas pueden llevar correos o contenido.
	evento.breadcrumbs = undefined;
	return evento;
}

/** Error no controlado de una petición, etiquetado con su `requestId` y el id del usuario. */
export function reportarError(
	error: unknown,
	{ requestId, usuarioId }: { requestId?: string; usuarioId?: number },
) {
	if (!env.SENTRY_DSN) return;
	Sentry.withScope((scope) => {
		if (requestId) scope.setTag("requestId", requestId);
		if (usuarioId) scope.setUser({ id: String(usuarioId) });
		Sentry.captureException(error);
	});
}
