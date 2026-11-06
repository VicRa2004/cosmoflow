import type { AppModule } from "@/core/shared/infrastructure/di/AppModule";
import { AUTH_TOKENS } from "@/modules/auth";
import { ActualizarPreferenciasInterfazUseCase } from "./application/useCases/ActualizarPreferenciasInterfazUseCase";
import { ObtenerPreferenciasInterfazUseCase } from "./application/useCases/ObtenerPreferenciasInterfazUseCase";
import { PreferenciaController } from "./infrastructure/http/controllers/PreferenciaController";
import { PreferenciaRouter } from "./infrastructure/http/routes/PreferenciaRouter";
import { PrismaPreferenciaRepository } from "./infrastructure/repository/PrismaPreferenciaRepository";

/** Preferencias de interfaz por usuario, guardadas en el servidor para todos sus dispositivos. */
export const preferenciaModule: AppModule = {
	mount(app, container) {
		const repo = new PrismaPreferenciaRepository();
		const obtener = new ObtenerPreferenciasInterfazUseCase(repo);
		const router = new PreferenciaRouter(
			container.get(AUTH_TOKENS.AuthMiddleware),
			new PreferenciaController({
				obtener,
				actualizar: new ActualizarPreferenciasInterfazUseCase(repo, obtener),
			}),
		);
		app.route("/api/preferencias", router.router);
	},
};
