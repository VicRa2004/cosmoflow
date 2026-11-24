import type { AppModule } from "@/core/shared/infrastructure/di/AppModule";
import { TOKENS } from "@/core/shared/infrastructure/di/tokens";
import { AUTH_TOKENS } from "@/modules/auth";
import { BuscarUseCase } from "./application/useCases/BuscarUseCase";
import { BusquedaController } from "./infrastructure/http/controllers/BusquedaController";
import { BusquedaRouter } from "./infrastructure/http/routes/BusquedaRouter";
import { PrismaBusquedaRepository } from "./infrastructure/repository/PrismaBusquedaRepository";

export const busquedaModule: AppModule = {
	mount(app, container) {
		app.route(
			"/api/busqueda",
			new BusquedaRouter(
				container.get(AUTH_TOKENS.AuthMiddleware),
				container.get(TOKENS.PermisoGuard),
				new BusquedaController(
					new BuscarUseCase(new PrismaBusquedaRepository()),
				),
			).router,
		);
	},
};
