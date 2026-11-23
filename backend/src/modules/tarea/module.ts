import type { AppModule } from "@/core/shared/infrastructure/di/AppModule";
import { TOKENS } from "@/core/shared/infrastructure/di/tokens";
import { ADJUNTO_TOKENS } from "@/modules/adjunto";
import { env } from "@/core/config/env";
import { AUTH_TOKENS } from "@/modules/auth";
import { EQUIPO_TOKENS } from "@/modules/equipo";
import { ORGANIZACION_TOKENS } from "@/modules/organizacion";
import { PROYECTO_TOKENS } from "@/modules/proyecto";
import { ReubicarTareas } from "./application/subscribers/ReubicarTareas";
import { ContextosTarea } from "./application/services/ContextosTarea";
import { AccionLoteTareasUseCase } from "./application/useCases/AccionLoteTareasUseCase";
import { DuplicarTareaUseCase } from "./application/useCases/DuplicarTareaUseCase";
import { EliminarLoteTareasUseCase } from "./application/useCases/EliminarLoteTareasUseCase";
import { MoverTareaUseCase } from "./application/useCases/MoverTareaUseCase";
import { ActualizarComentarioUseCase } from "./application/useCases/ActualizarComentarioUseCase";
import { ActualizarTareaUseCase } from "./application/useCases/ActualizarTareaUseCase";
import { CrearComentarioUseCase } from "./application/useCases/CrearComentarioUseCase";
import { EliminarComentarioUseCase } from "./application/useCases/EliminarComentarioUseCase";
import { ObtenerActividadTareaUseCase } from "./application/useCases/ObtenerActividadTareaUseCase";
import { ObtenerComentariosUseCase } from "./application/useCases/ObtenerComentariosUseCase";
import { CrearTareaUseCase } from "./application/useCases/CrearTareaUseCase";
import { EliminarTareaDefinitivoUseCase } from "./application/useCases/EliminarTareaDefinitivoUseCase";
import { EliminarTareaUseCase } from "./application/useCases/EliminarTareaUseCase";
import {
	DIAS_PAPELERA_TAREAS,
	ObtenerPapeleraTareasUseCase,
} from "./application/useCases/ObtenerPapeleraTareasUseCase";
import { RestaurarTareaUseCase } from "./application/useCases/RestaurarTareaUseCase";
import { GenerarSuscripcionCalendarioUseCase } from "./application/useCases/GenerarSuscripcionCalendarioUseCase";
import { ObtenerFeedCalendarioUseCase } from "./application/useCases/ObtenerFeedCalendarioUseCase";
import { ObtenerSuscripcionCalendarioUseCase } from "./application/useCases/ObtenerSuscripcionCalendarioUseCase";
import { RevocarSuscripcionCalendarioUseCase } from "./application/useCases/RevocarSuscripcionCalendarioUseCase";
import { CalendarioController } from "./infrastructure/http/controllers/CalendarioController";
import { CalendarioRouter } from "./infrastructure/http/routes/CalendarioRouter";
import { PrismaSuscripcionCalendarioRepository } from "./infrastructure/repository/PrismaSuscripcionCalendarioRepository";
import { ActualizarPlantillaUseCase } from "./application/useCases/plantillas/ActualizarPlantillaUseCase";
import { CrearPlantillaUseCase } from "./application/useCases/plantillas/CrearPlantillaUseCase";
import { EliminarPlantillaUseCase } from "./application/useCases/plantillas/EliminarPlantillaUseCase";
import { ObtenerPlantillasUseCase } from "./application/useCases/plantillas/ObtenerPlantillasUseCase";
import { PlantillaTareaController } from "./infrastructure/http/controllers/PlantillaTareaController";
import { PlantillaTareaRouter } from "./infrastructure/http/routes/PlantillaTareaRouter";
import { PrismaPlantillaTareaRepository } from "./infrastructure/repository/PrismaPlantillaTareaRepository";
import { ObtenerCalendarioUseCase } from "./application/useCases/ObtenerCalendarioUseCase";
import { ObtenerEstadisticasTareasUseCase } from "./application/useCases/ObtenerEstadisticasTareasUseCase";
import { ObtenerTareaUseCase } from "./application/useCases/ObtenerTareaUseCase";
import { ObtenerPendientesUseCase } from "./application/useCases/ObtenerPendientesUseCase";
import { ObtenerTareasUseCase } from "./application/useCases/ObtenerTareasUseCase";
import { ComentarioTareaController } from "./infrastructure/http/controllers/ComentarioTareaController";
import { PapeleraTareaController } from "./infrastructure/http/controllers/PapeleraTareaController";
import { ComentarioTareaRouter } from "./infrastructure/http/routes/ComentarioTareaRouter";
import { TareaController } from "./infrastructure/http/controllers/TareaController";
import { TareaRouter } from "./infrastructure/http/routes/TareaRouter";
import { PrismaActividadTareaRepository } from "./infrastructure/repository/PrismaActividadTareaRepository";
import { PrismaComentarioTareaRepository } from "./infrastructure/repository/PrismaComentarioTareaRepository";
import { PrismaTareaRepository } from "./infrastructure/repository/PrismaTareaRepository";

const repo = new PrismaTareaRepository();

export const tareaModule: AppModule = {
	mount(app, container) {
		const contextos = new ContextosTarea(
			container.get(EQUIPO_TOKENS.TareasEquipo),
			container.get(PROYECTO_TOKENS.TareasProyecto),
			container.get(ORGANIZACION_TOKENS.TareasOrganizacion),
		);
		const eventBus = container.get(TOKENS.EventBus);
		const uow = container.get(TOKENS.UnitOfWork);
		new ReubicarTareas(eventBus, repo).suscribir();
		const router = new TareaRouter(
			container.get(AUTH_TOKENS.AuthMiddleware),
			container.get(TOKENS.PermisoGuard),
			new TareaController({
				crear: new CrearTareaUseCase(repo, contextos, eventBus, uow),
				obtenerTodos: new ObtenerTareasUseCase(repo, contextos),
				obtenerPendientes: new ObtenerPendientesUseCase(repo),
				calendario: new ObtenerCalendarioUseCase(repo),
				obtenerUno: new ObtenerTareaUseCase(repo, contextos),
				actualizar: new ActualizarTareaUseCase(repo, contextos, eventBus, uow),
				eliminar: new EliminarTareaUseCase(repo, contextos, eventBus, uow),
				duplicar: new DuplicarTareaUseCase(repo, contextos, eventBus, uow),
				accionLote: new AccionLoteTareasUseCase(repo, contextos, eventBus, uow),
				eliminarLote: new EliminarLoteTareasUseCase(
					repo,
					contextos,
					eventBus,
					uow,
				),
				estadisticas: new ObtenerEstadisticasTareasUseCase(repo, contextos),
				mover: new MoverTareaUseCase(
					repo,
					contextos,
					container.get(ADJUNTO_TOKENS.CompartirAdjuntos),
					eventBus,
					uow,
				),
			}),
			new PapeleraTareaController({
				obtenerTodos: new ObtenerPapeleraTareasUseCase(repo),
				restaurar: new RestaurarTareaUseCase(repo, contextos, eventBus, uow),
				eliminar: new EliminarTareaDefinitivoUseCase(repo, contextos),
			}),
		);
		const comentarios = new PrismaComentarioTareaRepository();
		app.route(
			"/api/tareas",
			new ComentarioTareaRouter(
				container.get(AUTH_TOKENS.AuthMiddleware),
				container.get(TOKENS.PermisoGuard),
				new ComentarioTareaController({
					obtenerTodos: new ObtenerComentariosUseCase(
						repo,
						contextos,
						comentarios,
					),
					crear: new CrearComentarioUseCase(
						repo,
						contextos,
						comentarios,
						eventBus,
						uow,
					),
					actualizar: new ActualizarComentarioUseCase(
						repo,
						contextos,
						comentarios,
						eventBus,
						uow,
					),
					eliminar: new EliminarComentarioUseCase(repo, contextos, comentarios),
					actividad: new ObtenerActividadTareaUseCase(
						repo,
						contextos,
						new PrismaActividadTareaRepository(),
					),
				}),
			).router,
		);
		app.route("/api/tareas", router.router);
		const plantillas = new PrismaPlantillaTareaRepository();
		const acceso = container.get(ORGANIZACION_TOKENS.AccesoOrganizacion);
		const plantillaController = new PlantillaTareaController({
			obtenerTodos: new ObtenerPlantillasUseCase(plantillas, acceso),
			crear: new CrearPlantillaUseCase(plantillas, acceso),
			actualizar: new ActualizarPlantillaUseCase(plantillas, acceso),
			eliminar: new EliminarPlantillaUseCase(plantillas, acceso),
		});
		const auth = container.get(AUTH_TOKENS.AuthMiddleware);
		const guard = container.get(TOKENS.PermisoGuard);
		app.route(
			"/api/plantillas",
			new PlantillaTareaRouter(auth, guard, plantillaController).router,
		);
		app.route(
			"/api/organizaciones/:organizacionId/plantillas",
			new PlantillaTareaRouter(auth, guard, plantillaController, true).router,
		);
		const suscripciones = new PrismaSuscripcionCalendarioRepository();
		app.route(
			"/api/calendario",
			new CalendarioRouter(
				container.get(AUTH_TOKENS.AuthMiddleware),
				container.get(TOKENS.PermisoGuard),
				new CalendarioController({
					feed: new ObtenerFeedCalendarioUseCase(suscripciones, repo),
					obtener: new ObtenerSuscripcionCalendarioUseCase(suscripciones),
					generar: new GenerarSuscripcionCalendarioUseCase(
						suscripciones,
						env.APP_URL,
					),
					revocar: new RevocarSuscripcionCalendarioUseCase(suscripciones),
				}),
			).router,
		);
	},
	onStart(container) {
		container
			.get(TOKENS.Scheduler)
			.programar("tarea.purgar-papelera", 60 * 60 * 1000, async () => {
				await repo.purgarEliminadas(
					new Date(Date.now() - DIAS_PAPELERA_TAREAS * 24 * 60 * 60 * 1000),
				);
			});
		return undefined;
	},
};
