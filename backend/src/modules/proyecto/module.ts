import type { AppModule } from "@/core/shared/infrastructure/di/AppModule";
import { TOKENS } from "@/core/shared/infrastructure/di/tokens";
import { AUTH_TOKENS } from "@/modules/auth";
import { EQUIPO_TOKENS } from "@/modules/equipo";
import { ORGANIZACION_TOKENS } from "@/modules/organizacion";
import { TareasProyectoService } from "./application/services/TareasProyectoService";
import { PROYECTO_TOKENS } from "./infrastructure/tokens";
import { BajaEquipoProyectos } from "./application/services/BajaEquipoProyectos";
import { ActualizarProyectoUseCase } from "./application/useCases/ActualizarProyectoUseCase";
import { CrearProyectoUseCase } from "./application/useCases/CrearProyectoUseCase";
import { EliminarProyectoUseCase } from "./application/useCases/EliminarProyectoUseCase";
import { ObtenerProyectoUseCase } from "./application/useCases/ObtenerProyectoUseCase";
import { ObtenerProyectosUseCase } from "./application/useCases/ObtenerProyectosUseCase";
import { ProyectoController } from "./infrastructure/http/controllers/ProyectoController";
import { ProyectoRouter } from "./infrastructure/http/routes/ProyectoRouter";
import { PrismaProyectoRepository } from "./infrastructure/repository/PrismaProyectoRepository";

export const proyectoModule: AppModule = {
	register(container) {
		// Sustituye al de `equipo`, que no bloquea (RN-31).
		container.set(
			EQUIPO_TOKENS.BajaEquipo,
			() => new BajaEquipoProyectos(new PrismaProyectoRepository()),
		);
		container.set(
			PROYECTO_TOKENS.TareasProyecto,
			() => new TareasProyectoService(new PrismaProyectoRepository()),
		);
	},
	mount(app, container) {
		const repo = new PrismaProyectoRepository();
		const acceso = container.get(ORGANIZACION_TOKENS.AccesoOrganizacion);
		const eventBus = container.get(TOKENS.EventBus);
		const uow = container.get(TOKENS.UnitOfWork);
		app.route(
			"/api/organizaciones/:organizacionId/proyectos",
			new ProyectoRouter(
				container.get(AUTH_TOKENS.AuthMiddleware),
				container.get(TOKENS.PermisoGuard),
				new ProyectoController({
					obtenerTodos: new ObtenerProyectosUseCase(repo, acceso),
					obtenerUno: new ObtenerProyectoUseCase(repo, acceso),
					crear: new CrearProyectoUseCase(repo, acceso),
					actualizar: new ActualizarProyectoUseCase(
						repo,
						acceso,
						eventBus,
						uow,
					),
					eliminar: new EliminarProyectoUseCase(repo, acceso, eventBus, uow),
				}),
			).router,
		);
	},
};
