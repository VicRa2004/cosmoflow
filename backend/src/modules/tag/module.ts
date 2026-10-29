import type { AppModule } from "@/core/shared/infrastructure/di/AppModule";
import { TOKENS } from "@/core/shared/infrastructure/di/tokens";
import { AUTH_TOKENS } from "@/modules/auth";
import { ActualizarTagUseCase } from "./application/useCases/ActualizarTagUseCase";
import { CrearTagUseCase } from "./application/useCases/CrearTagUseCase";
import { EliminarTagUseCase } from "./application/useCases/EliminarTagUseCase";
import { ObtenerTagUseCase } from "./application/useCases/ObtenerTagUseCase";
import { ObtenerTagsUseCase } from "./application/useCases/ObtenerTagsUseCase";
import { TagController } from "./infrastructure/http/controllers/TagController";
import { TagRouter } from "./infrastructure/http/routes/TagRouter";
import { PrismaTagRepository } from "./infrastructure/repository/PrismaTagRepository";

export const tagModule: AppModule = {
	mount(app, container) {
		const repo = new PrismaTagRepository();
		const router = new TagRouter(
			container.get(AUTH_TOKENS.AuthMiddleware),
			container.get(TOKENS.PermisoGuard),
			new TagController({
				crear: new CrearTagUseCase(repo),
				obtenerTodos: new ObtenerTagsUseCase(repo),
				obtenerUno: new ObtenerTagUseCase(repo),
				actualizar: new ActualizarTagUseCase(repo),
				eliminar: new EliminarTagUseCase(repo),
			}),
		);
		app.route("/api/tags", router.router);
	},
};
