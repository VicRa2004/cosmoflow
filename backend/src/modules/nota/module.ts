import type { AppModule } from "@/core/shared/infrastructure/di/AppModule";
import { TOKENS } from "@/core/shared/infrastructure/di/tokens";
import { AUTH_TOKENS } from "@/modules/auth";
import { PROYECTO_TOKENS } from "@/modules/proyecto";
import { ProyectosNota } from "./application/services/ProyectosNota";
import { ActualizarNotaUseCase } from "./application/useCases/ActualizarNotaUseCase";
import { CrearNotaUseCase } from "./application/useCases/CrearNotaUseCase";
import { EliminarNotaUseCase } from "./application/useCases/EliminarNotaUseCase";
import { ObtenerNotaUseCase } from "./application/useCases/ObtenerNotaUseCase";
import { ObtenerNotasUseCase } from "./application/useCases/ObtenerNotasUseCase";
import { NotaController } from "./infrastructure/http/controllers/NotaController";
import { NotaRouter } from "./infrastructure/http/routes/NotaRouter";
import { PrismaNotaRepository } from "./infrastructure/repository/PrismaNotaRepository";

export const notaModule: AppModule = {
	mount(app, container) {
		const repo = new PrismaNotaRepository();
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
		const router = new NotaRouter(
			container.get(AUTH_TOKENS.AuthMiddleware),
			container.get(TOKENS.PermisoGuard),
			new NotaController({
				crear: new CrearNotaUseCase(repo, proyectos),
				obtenerTodos: new ObtenerNotasUseCase(repo, proyectos),
				obtenerUno: new ObtenerNotaUseCase(proyectos),
				actualizar: new ActualizarNotaUseCase(repo, proyectos),
				eliminar: new EliminarNotaUseCase(repo, proyectos),
			}),
		);
		app.route("/api/notas", router.router);
	},
};
