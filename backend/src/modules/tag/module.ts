import type { AppModule } from "@/core/shared/infrastructure/di/AppModule";
import { TOKENS } from "@/core/shared/infrastructure/di/tokens";
import { AUTH_TOKENS } from "@/modules/auth";
import { ORGANIZACION_TOKENS } from "@/modules/organizacion";
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
		const acceso = container.get(ORGANIZACION_TOKENS.AccesoOrganizacion);
		const controller = new TagController({
			crear: new CrearTagUseCase(repo, acceso),
			obtenerTodos: new ObtenerTagsUseCase(repo, acceso),
			obtenerUno: new ObtenerTagUseCase(repo, acceso),
			actualizar: new ActualizarTagUseCase(repo, acceso),
			eliminar: new EliminarTagUseCase(repo, acceso),
		});
		const auth = container.get(AUTH_TOKENS.AuthMiddleware);
		const guard = container.get(TOKENS.PermisoGuard);
		app.route("/api/tags", new TagRouter(auth, guard, controller).router);
		app.route(
			"/api/organizaciones/:organizacionId/tags",
			new TagRouter(auth, guard, controller, true).router,
		);
	},
};
