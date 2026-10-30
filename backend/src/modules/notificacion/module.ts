import { env } from "@/core/config/env";
import type { AppModule } from "@/core/shared/infrastructure/di/AppModule";
import { TOKENS } from "@/core/shared/infrastructure/di/tokens";
import { AUTH_TOKENS } from "@/modules/auth";
import { ORGANIZACION_TOKENS } from "@/modules/organizacion";
import { Notificador } from "./application/services/Notificador";
import { AtenderBotTelegram } from "./application/telegram/AtenderBotTelegram";
import { NotificarTareas } from "./application/subscribers/NotificarTareas";
import { DesvincularTelegramUseCase } from "./application/useCases/DesvincularTelegramUseCase";
import { IniciarVinculoTelegramUseCase } from "./application/useCases/IniciarVinculoTelegramUseCase";
import { ObtenerEstadoTelegramUseCase } from "./application/useCases/ObtenerEstadoTelegramUseCase";
import { ActualizarPreferenciasOrganizacionUseCase } from "./application/useCases/ActualizarPreferenciasOrganizacionUseCase";
import { ActualizarPreferenciasUseCase } from "./application/useCases/ActualizarPreferenciasUseCase";
import { ObtenerPreferenciasOrganizacionUseCase } from "./application/useCases/ObtenerPreferenciasOrganizacionUseCase";
import { ObtenerPreferenciasUseCase } from "./application/useCases/ObtenerPreferenciasUseCase";
import { CorreoCanal } from "./infrastructure/canales/CorreoCanal";
import { TelegramCanal } from "./infrastructure/canales/TelegramCanal";
import { NotificacionController } from "./infrastructure/http/controllers/NotificacionController";
import { NotificacionOrganizacionRouter } from "./infrastructure/http/routes/NotificacionOrganizacionRouter";
import { NotificacionRouter } from "./infrastructure/http/routes/NotificacionRouter";
import { PrismaNotificacionRepository } from "./infrastructure/repository/PrismaNotificacionRepository";
import { PrismaVinculoTelegramRepository } from "./infrastructure/repository/PrismaVinculoTelegramRepository";
import { TelegramBotApi } from "./infrastructure/telegram/TelegramBotApi";

const repo = new PrismaNotificacionRepository();
const vinculos = new PrismaVinculoTelegramRepository();
// Sin TELEGRAM_BOT_TOKEN no hay canal Telegram ni polling.
const bot = env.TELEGRAM_BOT_TOKEN
	? new TelegramBotApi(env.TELEGRAM_BOT_TOKEN)
	: null;

/**
 * Avisos por correo de los eventos de tarea, según las preferencias de cada usuario y,
 * si no eligió, las de la organización de la tarea (RN-92).
 */
export const notificacionModule: AppModule = {
	mount(app, container) {
		const notificador = new Notificador(repo, [
			new CorreoCanal(container.get(TOKENS.Mailer)),
			...(bot ? [new TelegramCanal(bot)] : []),
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
			estadoTelegram: new ObtenerEstadoTelegramUseCase(vinculos, bot),
			vincularTelegram: new IniciarVinculoTelegramUseCase(vinculos, bot),
			desvincularTelegram: new DesvincularTelegramUseCase(vinculos),
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
		const scheduler = container.get(TOKENS.Scheduler);
		if (bot) {
			const atender = new AtenderBotTelegram(bot, vinculos);
			// Cada llamada espera hasta 10 s a que lleguen mensajes (long polling).
			scheduler.programar("notificacion.telegram", 1000, () =>
				atender.ejecutar(),
			);
		}
		// Las claves solo sirven mientras el outbox puede reintentar (minutos).
		scheduler.programar("notificacion.purgar", 24 * 60 * 60 * 1000, () =>
			repo.purgarEnvios(new Date(Date.now() - 30 * 86_400_000)),
		);
		return undefined;
	},
};
