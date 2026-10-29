import type { AppModule } from "@/core/shared/infrastructure/di/AppModule";
import { TOKENS } from "@/core/shared/infrastructure/di/tokens";
import { AUTH_TOKENS } from "@/modules/auth";
import { CambiarAvatarOrganizacionUseCase } from "./application/useCases/CambiarAvatarOrganizacionUseCase";
import { ObtenerAvatarOrganizacionUseCase } from "./application/useCases/ObtenerAvatarOrganizacionUseCase";
import { AvatarOrganizacionController } from "./infrastructure/http/controllers/AvatarOrganizacionController";
import { ActualizarOrganizacionUseCase } from "./application/useCases/ActualizarOrganizacionUseCase";
import { CrearOrganizacionUseCase } from "./application/useCases/CrearOrganizacionUseCase";
import { EliminarOrganizacionUseCase } from "./application/useCases/EliminarOrganizacionUseCase";
import { ObtenerOrganizacionUseCase } from "./application/useCases/ObtenerOrganizacionUseCase";
import { ObtenerOrganizacionesUseCase } from "./application/useCases/ObtenerOrganizacionesUseCase";
import { OrganizacionController } from "./infrastructure/http/controllers/OrganizacionController";
import { OrganizacionRouter } from "./infrastructure/http/routes/OrganizacionRouter";
import { PrismaOrganizacionRepository } from "./infrastructure/repository/PrismaOrganizacionRepository";

export const organizacionModule: AppModule = {
	mount(app, container) {
		const repo = new PrismaOrganizacionRepository();
		const almacenamiento = container.get(TOKENS.Almacenamiento);
		const router = new OrganizacionRouter(
			container.get(AUTH_TOKENS.AuthMiddleware),
			container.get(TOKENS.PermisoGuard),
			new OrganizacionController({
				crear: new CrearOrganizacionUseCase(repo),
				obtenerTodos: new ObtenerOrganizacionesUseCase(repo),
				obtenerUno: new ObtenerOrganizacionUseCase(repo),
				actualizar: new ActualizarOrganizacionUseCase(repo),
				eliminar: new EliminarOrganizacionUseCase(repo),
			}),
			new AvatarOrganizacionController({
				cambiar: new CambiarAvatarOrganizacionUseCase(repo, almacenamiento),
				obtener: new ObtenerAvatarOrganizacionUseCase(repo, almacenamiento),
			}),
		);
		app.route("/api/organizaciones", router.router);
	},
};
