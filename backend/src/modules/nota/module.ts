import type { AppModule } from "@/core/shared/infrastructure/di/AppModule";
import { TOKENS } from "@/core/shared/infrastructure/di/tokens";
import { AUTH_TOKENS } from "@/modules/auth";
import { PROYECTO_TOKENS } from "@/modules/proyecto";
import { CarpetasNota } from "./application/services/CarpetasNota";
import { ProyectosNota } from "./application/services/ProyectosNota";
import { ActualizarCarpetaUseCase } from "./application/useCases/ActualizarCarpetaUseCase";
import { ActualizarNotaUseCase } from "./application/useCases/ActualizarNotaUseCase";
import { CrearCarpetaUseCase } from "./application/useCases/CrearCarpetaUseCase";
import { CrearNotaUseCase } from "./application/useCases/CrearNotaUseCase";
import { DuplicarNotaUseCase } from "./application/useCases/DuplicarNotaUseCase";
import { EliminarCarpetaUseCase } from "./application/useCases/EliminarCarpetaUseCase";
import { EliminarNotaDefinitivoUseCase } from "./application/useCases/EliminarNotaDefinitivoUseCase";
import { EliminarNotaUseCase } from "./application/useCases/EliminarNotaUseCase";
import { ImportarNotasUseCase } from "./application/useCases/ImportarNotasUseCase";
import { ObtenerCarpetasUseCase } from "./application/useCases/ObtenerCarpetasUseCase";
import { ObtenerIndiceNotasUseCase } from "./application/useCases/ObtenerIndiceNotasUseCase";
import { ObtenerNotaUseCase } from "./application/useCases/ObtenerNotaUseCase";
import { ObtenerNotasUseCase } from "./application/useCases/ObtenerNotasUseCase";
import {
	DIAS_PAPELERA_NOTAS,
	ObtenerPapeleraNotasUseCase,
} from "./application/useCases/ObtenerPapeleraNotasUseCase";
import { RestaurarNotaUseCase } from "./application/useCases/RestaurarNotaUseCase";
import { CarpetaController } from "./infrastructure/http/controllers/CarpetaController";
import { NotaController } from "./infrastructure/http/controllers/NotaController";
import { PapeleraNotaController } from "./infrastructure/http/controllers/PapeleraNotaController";
import { CarpetaRouter } from "./infrastructure/http/routes/CarpetaRouter";
import { NotaRouter } from "./infrastructure/http/routes/NotaRouter";
import { PrismaCarpetaNotaRepository } from "./infrastructure/repository/PrismaCarpetaNotaRepository";
import { PrismaNotaRepository } from "./infrastructure/repository/PrismaNotaRepository";

const repo = new PrismaNotaRepository();

export const notaModule: AppModule = {
	mount(app, container) {
		// Idempotente: la reentrega del outbox ya no encuentra notas del proyecto.
		container
			.get(TOKENS.EventBus)
			.subscribe("proyecto.eliminado", (e) =>
				repo.hacerPersonales((e.data as { proyectoId: number }).proyectoId),
			);
		const proyectos = new ProyectosNota(
			repo,
			container.get(PROYECTO_TOKENS.TareasProyecto),
		);
		const carpetaRepo = new PrismaCarpetaNotaRepository();
		const carpetas = new CarpetasNota(carpetaRepo, proyectos);
		const auth = container.get(AUTH_TOKENS.AuthMiddleware);
		const guard = container.get(TOKENS.PermisoGuard);
		const router = new NotaRouter(
			auth,
			guard,
			new NotaController({
				crear: new CrearNotaUseCase(repo, proyectos),
				obtenerTodos: new ObtenerNotasUseCase(repo, proyectos),
				obtenerIndice: new ObtenerIndiceNotasUseCase(repo, proyectos),
				obtenerUno: new ObtenerNotaUseCase(proyectos),
				actualizar: new ActualizarNotaUseCase(repo, proyectos),
				eliminar: new EliminarNotaUseCase(repo, proyectos),
				duplicar: new DuplicarNotaUseCase(repo, proyectos),
				importar: new ImportarNotasUseCase(
					repo,
					carpetaRepo,
					proyectos,
					container.get(TOKENS.UnitOfWork),
				),
			}),
			new PapeleraNotaController({
				obtenerTodos: new ObtenerPapeleraNotasUseCase(repo),
				restaurar: new RestaurarNotaUseCase(repo, proyectos),
				eliminar: new EliminarNotaDefinitivoUseCase(repo, proyectos),
			}),
		);
		app.route("/api/notas", router.router);
		app.route(
			"/api/carpetas",
			new CarpetaRouter(
				auth,
				guard,
				new CarpetaController({
					crear: new CrearCarpetaUseCase(carpetaRepo, proyectos, carpetas),
					obtenerTodos: new ObtenerCarpetasUseCase(carpetaRepo, proyectos),
					actualizar: new ActualizarCarpetaUseCase(carpetaRepo, carpetas),
					eliminar: new EliminarCarpetaUseCase(carpetaRepo, carpetas),
				}),
			).router,
		);
	},
	onStart(container) {
		container
			.get(TOKENS.Scheduler)
			.programar("nota.purgar-papelera", 60 * 60 * 1000, async () => {
				await repo.purgarEliminadas(
					new Date(Date.now() - DIAS_PAPELERA_NOTAS * 24 * 60 * 60 * 1000),
				);
			});
		return undefined;
	},
};
