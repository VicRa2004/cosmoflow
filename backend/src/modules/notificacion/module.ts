import { env } from "@/core/config/env";
import type { AppModule } from "@/core/shared/infrastructure/di/AppModule";
import { TOKENS } from "@/core/shared/infrastructure/di/tokens";
import { AUTH_TOKENS } from "@/modules/auth";
import { ORGANIZACION_TOKENS } from "@/modules/organizacion";
import { Notificador } from "./application/services/Notificador";
import { NotificarTareas } from "./application/subscribers/NotificarTareas";
import { ActualizarPreferenciasOrganizacionUseCase } from "./application/useCases/ActualizarPreferenciasOrganizacionUseCase";
import { ActualizarPreferenciasUseCase } from "./application/useCases/ActualizarPreferenciasUseCase";
import { ObtenerPreferenciasOrganizacionUseCase } from "./application/useCases/ObtenerPreferenciasOrganizacionUseCase";
import { ObtenerPreferenciasUseCase } from "./application/useCases/ObtenerPreferenciasUseCase";
import { CorreoCanal } from "./infrastructure/canales/CorreoCanal";
import { NotificacionController } from "./infrastructure/http/controllers/NotificacionController";
import { NotificacionOrganizacionRouter } from "./infrastructure/http/routes/NotificacionOrganizacionRouter";
import { NotificacionRouter } from "./infrastructure/http/routes/NotificacionRouter";
import { PrismaNotificacionRepository } from "./infrastructure/repository/PrismaNotificacionRepository";

const repo = new PrismaNotificacionRepository();

/**
 * Avisos por correo de los eventos de tarea, según las preferencias de cada usuario y,
 * si no eligió, las de la organización de la tarea (RN-92).
 */
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

		const acceso = container.get(ORGANIZACION_TOKENS.AccesoOrganizacion);
		const authMiddleware = container.get(AUTH_TOKENS.AuthMiddleware);
		const controller = new NotificacionController({
			obtenerPreferencias: new ObtenerPreferenciasUseCase(repo),
			actualizarPreferencias: new ActualizarPreferenciasUseCase(repo),
			obtenerDeOrganizacion: new ObtenerPreferenciasOrganizacionUseCase(
				repo,
				acceso,
			),
			actualizarDeOrganizacion: new ActualizarPreferenciasOrganizacionUseCase(
				repo,
				acceso,
			),
		});
		app.route(
			"/api/notificaciones",
			new NotificacionRouter(authMiddleware, controller).router,
		);
		app.route(
			"/api/organizaciones/:organizacionId/notificaciones",
			new NotificacionOrganizacionRouter(
				authMiddleware,
				container.get(TOKENS.PermisoGuard),
				controller,
			).router,
		);
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
