import type { AppModule } from "@/core/shared/infrastructure/di/AppModule";
import { TOKENS } from "@/core/shared/infrastructure/di/tokens";
import { AUTH_TOKENS } from "@/modules/auth";
import { ObtenerAdjuntoUseCase } from "./application/useCases/ObtenerAdjuntoUseCase";
import { SubirAdjuntoUseCase } from "./application/useCases/SubirAdjuntoUseCase";
import { AdjuntoController } from "./infrastructure/http/controllers/AdjuntoController";
import { AdjuntoRouter } from "./infrastructure/http/routes/AdjuntoRouter";
import { PrismaAdjuntoRepository } from "./infrastructure/repository/PrismaAdjuntoRepository";

export const adjuntoModule: AppModule = {
	mount(app, container) {
		const repo = new PrismaAdjuntoRepository();
		const almacenamiento = container.get(TOKENS.Almacenamiento);
		const router = new AdjuntoRouter(
			container.get(AUTH_TOKENS.AuthMiddleware),
			container.get(TOKENS.PermisoGuard),
			new AdjuntoController({
				subir: new SubirAdjuntoUseCase(repo, almacenamiento),
				obtener: new ObtenerAdjuntoUseCase(repo, almacenamiento),
			}),
		);
		app.route("/api/adjuntos", router.router);
	},
};
