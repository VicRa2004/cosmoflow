import type { AppModule } from "@/core/shared/infrastructure/di/AppModule";
import { TOKENS } from "@/core/shared/infrastructure/di/tokens";
import { AUTH_TOKENS } from "@/modules/auth";
import { ORGANIZACION_TOKENS } from "@/modules/organizacion";
import { SalidaMiembroEquipos } from "./application/services/SalidaMiembroEquipos";
import { ActualizarEquipoUseCase } from "./application/useCases/ActualizarEquipoUseCase";
import { CambiarDelegadosUseCase } from "./application/useCases/CambiarDelegadosUseCase";
import { CrearEquipoUseCase } from "./application/useCases/CrearEquipoUseCase";
import { EliminarEquipoUseCase } from "./application/useCases/EliminarEquipoUseCase";
import { ObtenerEquipoUseCase } from "./application/useCases/ObtenerEquipoUseCase";
import { ObtenerEquiposUseCase } from "./application/useCases/ObtenerEquiposUseCase";
import { EquipoController } from "./infrastructure/http/controllers/EquipoController";
import { EquipoRouter } from "./infrastructure/http/routes/EquipoRouter";
import { PrismaEquipoRepository } from "./infrastructure/repository/PrismaEquipoRepository";

export const equipoModule: AppModule = {
	register(container) {
		// Sustituye al de `organizacion`, que no bloquea (RN-26).
		container.set(
			ORGANIZACION_TOKENS.SalidaMiembro,
			() => new SalidaMiembroEquipos(new PrismaEquipoRepository()),
		);
	},
	mount(app, container) {
		const repo = new PrismaEquipoRepository();
		const acceso = container.get(ORGANIZACION_TOKENS.AccesoOrganizacion);
		app.route(
			"/api/organizaciones/:organizacionId/equipos",
			new EquipoRouter(
				container.get(AUTH_TOKENS.AuthMiddleware),
				container.get(TOKENS.PermisoGuard),
				new EquipoController({
					obtenerTodos: new ObtenerEquiposUseCase(repo, acceso),
					obtenerUno: new ObtenerEquipoUseCase(repo, acceso),
					crear: new CrearEquipoUseCase(repo, acceso),
					actualizar: new ActualizarEquipoUseCase(repo, acceso),
					delegados: new CambiarDelegadosUseCase(repo, acceso),
					eliminar: new EliminarEquipoUseCase(repo, acceso),
				}),
			).router,
		);
	},
};
