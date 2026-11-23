import { env } from "@/core/config/env";
import type { AppModule } from "@/core/shared/infrastructure/di/AppModule";
import type { DependencyContainer } from "@/core/shared/infrastructure/di/DependencyContainer";
import { TOKENS } from "@/core/shared/infrastructure/di/tokens";
import { AUTH_TOKENS } from "@/modules/auth";
import { ORGANIZACION_TOKENS } from "@/modules/organizacion";
import { AvisarVencimientos } from "./application/services/AvisarVencimientos";
import { EnviarResumenDiario } from "./application/services/EnviarResumenDiario";
import { Notificador } from "./application/services/Notificador";
import { AtenderBotTelegram } from "./application/telegram/AtenderBotTelegram";
import { NotificarTareas } from "./application/subscribers/NotificarTareas";
import { ActualizarPreferenciasOrganizacionUseCase } from "./application/useCases/ActualizarPreferenciasOrganizacionUseCase";
import { ActualizarPreferenciasUseCase } from "./application/useCases/ActualizarPreferenciasUseCase";
import { DesvincularTelegramUseCase } from "./application/useCases/DesvincularTelegramUseCase";
import { EliminarDispositivoPushUseCase } from "./application/useCases/EliminarDispositivoPushUseCase";
import { IniciarVinculoTelegramUseCase } from "./application/useCases/IniciarVinculoTelegramUseCase";
import { MarcarNotificacionLeidaUseCase } from "./application/useCases/MarcarNotificacionLeidaUseCase";
import { MarcarTodasNotificacionesLeidasUseCase } from "./application/useCases/MarcarTodasNotificacionesLeidasUseCase";
import { ObtenerEstadoMovilUseCase } from "./application/useCases/ObtenerEstadoMovilUseCase";
import { ObtenerEstadoTelegramUseCase } from "./application/useCases/ObtenerEstadoTelegramUseCase";
import { ObtenerNotificacionesUseCase } from "./application/useCases/ObtenerNotificacionesUseCase";
import { ObtenerPreferenciasOrganizacionUseCase } from "./application/useCases/ObtenerPreferenciasOrganizacionUseCase";
import { ObtenerPreferenciasUseCase } from "./application/useCases/ObtenerPreferenciasUseCase";
import { RegistrarDispositivoPushUseCase } from "./application/useCases/RegistrarDispositivoPushUseCase";
import { AppCanal } from "./infrastructure/canales/AppCanal";
import { CorreoCanal } from "./infrastructure/canales/CorreoCanal";
import { MovilCanal } from "./infrastructure/canales/MovilCanal";
import { TelegramCanal } from "./infrastructure/canales/TelegramCanal";
import { BandejaNotificacionController } from "./infrastructure/http/controllers/BandejaNotificacionController";
import { DispositivoPushController } from "./infrastructure/http/controllers/DispositivoPushController";
import { NotificacionController } from "./infrastructure/http/controllers/NotificacionController";
import { NotificacionOrganizacionRouter } from "./infrastructure/http/routes/NotificacionOrganizacionRouter";
import { NotificacionRouter } from "./infrastructure/http/routes/NotificacionRouter";
import { FcmCliente } from "./infrastructure/push/FcmCliente";
import { PrismaBandejaNotificacionRepository } from "./infrastructure/repository/PrismaBandejaNotificacionRepository";
import { PrismaDispositivoPushRepository } from "./infrastructure/repository/PrismaDispositivoPushRepository";
import { PrismaNotificacionRepository } from "./infrastructure/repository/PrismaNotificacionRepository";
import { PrismaVinculoTelegramRepository } from "./infrastructure/repository/PrismaVinculoTelegramRepository";
import { TelegramBotApi } from "./infrastructure/telegram/TelegramBotApi";

const repo = new PrismaNotificacionRepository();
const bandeja = new PrismaBandejaNotificacionRepository();
const dispositivos = new PrismaDispositivoPushRepository();
const vinculos = new PrismaVinculoTelegramRepository();
// Sin TELEGRAM_BOT_TOKEN no hay canal Telegram ni polling.
const bot = env.TELEGRAM_BOT_TOKEN
	? new TelegramBotApi(env.TELEGRAM_BOT_TOKEN)
	: null;
// Sin credenciales FCM no hay canal móvil.
const fcm =
	env.FCM_PROJECT_ID && env.FCM_CLIENT_EMAIL && env.FCM_PRIVATE_KEY
		? new FcmCliente(
				env.FCM_PROJECT_ID,
				env.FCM_CLIENT_EMAIL,
				env.FCM_PRIVATE_KEY,
			)
		: null;
// Sin estado: `mount` y `onStart` crean el suyo con los canales activos.
const crearNotificador = (container: DependencyContainer) =>
	new Notificador(repo, [
		new AppCanal(bandeja),
		new CorreoCanal(container.get(TOKENS.Mailer)),
		...(bot ? [new TelegramCanal(bot)] : []),
		...(fcm ? [new MovilCanal(fcm, dispositivos)] : []),
	]);

/**
 * Avisos por correo de los eventos de tarea, según las preferencias de cada usuario y,
 * si no eligió, las de la organización de la tarea (RN-92).
 */
export const notificacionModule: AppModule = {
	mount(app, container) {
		new NotificarTareas(
			container.get(TOKENS.EventBus),
			repo,
			crearNotificador(container),
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
		const dispositivosController = new DispositivoPushController({
			estadoMovil: new ObtenerEstadoMovilUseCase(dispositivos, fcm),
			registrarDispositivo: new RegistrarDispositivoPushUseCase(dispositivos),
			eliminarDispositivo: new EliminarDispositivoPushUseCase(dispositivos),
		});
		const bandejaController = new BandejaNotificacionController({
			obtener: new ObtenerNotificacionesUseCase(bandeja),
			marcarLeida: new MarcarNotificacionLeidaUseCase(bandeja),
			marcarTodasLeidas: new MarcarTodasNotificacionesLeidasUseCase(bandeja),
		});
		app.route(
			"/api/notificaciones",
			new NotificacionRouter(
				authMiddleware,
				controller,
				dispositivosController,
				bandejaController,
			).router,
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
		const vencimientos = new AvisarVencimientos(
			repo,
			crearNotificador(container),
			env.APP_URL,
			env.ZONA_HORARIA,
		);
		// Cada hora; avisa una vez por tarea y día gracias a las claves de envío.
		scheduler.programar("notificacion.vencimientos", 60 * 60 * 1000, () =>
			vencimientos.ejecutar(),
		);
		const resumen = new EnviarResumenDiario(
			repo,
			crearNotificador(container),
			env.APP_URL,
			env.ZONA_HORARIA,
		);
		// Cada hora; manda uno al día por usuario gracias a las claves de envío.
		scheduler.programar("notificacion.resumen-diario", 60 * 60 * 1000, () =>
			resumen.ejecutar(),
		);
		// Las de eventos solo sirven mientras el outbox reintenta; las de vencimiento, ese día.
		scheduler.programar(
			"notificacion.purgar",
			24 * 60 * 60 * 1000,
			async () => {
				await repo.purgarEnvios(new Date(Date.now() - 30 * 86_400_000));
				await bandeja.purgarLeidas(new Date(Date.now() - 90 * 86_400_000));
			},
		);
		return undefined;
	},
};
