import type { AppModule } from "@/core/shared/infrastructure/di/AppModule";
import { TOKENS } from "@/core/shared/infrastructure/di/tokens";
import { ADJUNTO_TOKENS } from "@/modules/adjunto";
import { AUTH_TOKENS } from "@/modules/auth";
import { EQUIPO_TOKENS } from "@/modules/equipo";
import { PROYECTO_TOKENS } from "@/modules/proyecto";
import { ContextosTarea } from "./application/services/ContextosTarea";
import { MoverTareaUseCase } from "./application/useCases/MoverTareaUseCase";
import { ActualizarTareaUseCase } from "./application/useCases/ActualizarTareaUseCase";
import { CrearTareaUseCase } from "./application/useCases/CrearTareaUseCase";
import { EliminarTareaUseCase } from "./application/useCases/EliminarTareaUseCase";
import { ObtenerTareaUseCase } from "./application/useCases/ObtenerTareaUseCase";
import { ObtenerPendientesUseCase } from "./application/useCases/ObtenerPendientesUseCase";
import { ObtenerTareasUseCase } from "./application/useCases/ObtenerTareasUseCase";
import { TareaController } from "./infrastructure/http/controllers/TareaController";
import { TareaRouter } from "./infrastructure/http/routes/TareaRouter";
import { PrismaTareaRepository } from "./infrastructure/repository/PrismaTareaRepository";

export const tareaModule: AppModule = {
	mount(app, container) {
		const repo = new PrismaTareaRepository();
		const contextos = new ContextosTarea(
			container.get(EQUIPO_TOKENS.TareasEquipo),
			container.get(PROYECTO_TOKENS.TareasProyecto),
		);
		const router = new TareaRouter(
			container.get(AUTH_TOKENS.AuthMiddleware),
			container.get(TOKENS.PermisoGuard),
			new TareaController({
				crear: new CrearTareaUseCase(repo, contextos),
				obtenerTodos: new ObtenerTareasUseCase(repo, contextos),
				obtenerPendientes: new ObtenerPendientesUseCase(repo),
				obtenerUno: new ObtenerTareaUseCase(repo, contextos),
				actualizar: new ActualizarTareaUseCase(repo, contextos),
				eliminar: new EliminarTareaUseCase(repo, contextos),
				mover: new MoverTareaUseCase(
					repo,
					contextos,
					container.get(ADJUNTO_TOKENS.CompartirAdjuntos),
				),
			}),
		);
		app.route("/api/tareas", router.router);
	},
};
