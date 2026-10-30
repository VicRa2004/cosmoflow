import { env } from "@/core/config/env";
import type { AppModule } from "@/core/shared/infrastructure/di/AppModule";
import { TOKENS } from "@/core/shared/infrastructure/di/tokens";
import { AUTH_TOKENS } from "@/modules/auth";
import { Notificador } from "./application/services/Notificador";
import { NotificarTareas } from "./application/subscribers/NotificarTareas";
import { ActualizarPreferenciasUseCase } from "./application/useCases/ActualizarPreferenciasUseCase";
import { ObtenerPreferenciasUseCase } from "./application/useCases/ObtenerPreferenciasUseCase";
import { CorreoCanal } from "./infrastructure/canales/CorreoCanal";
import { NotificacionController } from "./infrastructure/http/controllers/NotificacionController";
import { NotificacionRouter } from "./infrastructure/http/routes/NotificacionRouter";
import { PrismaNotificacionRepository } from "./infrastructure/repository/PrismaNotificacionRepository";

const repo = new PrismaNotificacionRepository();

/** Avisos por correo de los eventos de tarea, según las preferencias de cada usuario (RN-92). */
export const notificacionModule: AppModule = {
	mount(app, container) {
		const notificador = new Notificador(repo, [
			new CorreoCanal(container.get(TOKENS.Mailer)),
		]);
		new NotificarTareas(
			container.get(TOKENS.EventBus),
			repo,
			notificador,
			env.APP_URL,
		).suscribir();

		const router = new NotificacionRouter(
			container.get(AUTH_TOKENS.AuthMiddleware),
			new NotificacionController({
				obtenerPreferencias: new ObtenerPreferenciasUseCase(repo),
				actualizarPreferencias: new ActualizarPreferenciasUseCase(repo),
			}),
		);
		app.route("/api/notificaciones", router.router);
	},
	onStart(container) {
		// Las claves solo sirven mientras el outbox puede reintentar (minutos).
		container
			.get(TOKENS.Scheduler)
			.programar("notificacion.purgar", 24 * 60 * 60 * 1000, () =>
				repo.purgarEnvios(new Date(Date.now() - 30 * 86_400_000)),
			);
		return undefined;
	},
};
