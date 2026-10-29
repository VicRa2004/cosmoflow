import type { AppModule } from "@/core/shared/infrastructure/di/AppModule";
import { TOKENS } from "@/core/shared/infrastructure/di/tokens";
import { AUTH_TOKENS } from "@/modules/auth";
import { ActualizarTareaUseCase } from "./application/useCases/ActualizarTareaUseCase";
import { CrearTareaUseCase } from "./application/useCases/CrearTareaUseCase";
import { EliminarTareaUseCase } from "./application/useCases/EliminarTareaUseCase";
import { ObtenerTareaUseCase } from "./application/useCases/ObtenerTareaUseCase";
import { ObtenerTareasUseCase } from "./application/useCases/ObtenerTareasUseCase";
import { TareaController } from "./infrastructure/http/controllers/TareaController";
import { TareaRouter } from "./infrastructure/http/routes/TareaRouter";
import { PrismaTareaRepository } from "./infrastructure/repository/PrismaTareaRepository";

export const tareaModule: AppModule = {
	mount(app, container) {
		const repo = new PrismaTareaRepository();
		const router = new TareaRouter(
			container.get(AUTH_TOKENS.AuthMiddleware),
			container.get(TOKENS.PermisoGuard),
			new TareaController({
				crear: new CrearTareaUseCase(repo),
				obtenerTodos: new ObtenerTareasUseCase(repo),
				obtenerUno: new ObtenerTareaUseCase(repo),
				actualizar: new ActualizarTareaUseCase(repo),
				eliminar: new EliminarTareaUseCase(repo),
			}),
		);
		app.route("/api/tareas", router.router);
	},
};
