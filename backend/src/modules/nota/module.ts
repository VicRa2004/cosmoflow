import type { AppModule } from "@/core/shared/infrastructure/di/AppModule";
import { TOKENS } from "@/core/shared/infrastructure/di/tokens";
import { AUTH_TOKENS } from "@/modules/auth";
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
		const router = new NotaRouter(
			container.get(AUTH_TOKENS.AuthMiddleware),
			container.get(TOKENS.PermisoGuard),
			new NotaController({
				crear: new CrearNotaUseCase(repo),
				obtenerTodos: new ObtenerNotasUseCase(repo),
				obtenerUno: new ObtenerNotaUseCase(repo),
				actualizar: new ActualizarNotaUseCase(repo),
				eliminar: new EliminarNotaUseCase(repo),
			}),
		);
		app.route("/api/notas", router.router);
	},
};
