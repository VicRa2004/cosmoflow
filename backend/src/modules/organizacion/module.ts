import { env } from "@/core/config/env";
import type { AppModule } from "@/core/shared/infrastructure/di/AppModule";
import { TOKENS } from "@/core/shared/infrastructure/di/tokens";
import { AUTH_TOKENS } from "@/modules/auth";
import { AccesoOrganizacionService } from "./application/services/AccesoOrganizacionService";
import { EmisorInvitaciones } from "./application/services/EmisorInvitaciones";
import { ActualizarRolUseCase } from "./application/useCases/ActualizarRolUseCase";
import { AsignarRolesUseCase } from "./application/useCases/AsignarRolesUseCase";
import { CrearRolUseCase } from "./application/useCases/CrearRolUseCase";
import { EliminarRolUseCase } from "./application/useCases/EliminarRolUseCase";
import { ObtenerRolesUseCase } from "./application/useCases/ObtenerRolesUseCase";
import { RolController } from "./infrastructure/http/controllers/RolController";
import { RolRouter } from "./infrastructure/http/routes/RolRouter";
import { PrismaRolOrganizacionRepository } from "./infrastructure/repository/PrismaRolOrganizacionRepository";
import { DelegarAdministracionUseCase } from "./application/useCases/DelegarAdministracionUseCase";
import { ObtenerMiembrosUseCase } from "./application/useCases/ObtenerMiembrosUseCase";
import { QuitarMiembroUseCase } from "./application/useCases/QuitarMiembroUseCase";
import { MiembroController } from "./infrastructure/http/controllers/MiembroController";
import { MiembroRouter } from "./infrastructure/http/routes/MiembroRouter";
import { CancelarInvitacionUseCase } from "./application/useCases/CancelarInvitacionUseCase";
import { ConsultarInvitacionUseCase } from "./application/useCases/ConsultarInvitacionUseCase";
import { InvitarUseCase } from "./application/useCases/InvitarUseCase";
import { ObtenerInvitacionesUseCase } from "./application/useCases/ObtenerInvitacionesUseCase";
import { ReenviarInvitacionUseCase } from "./application/useCases/ReenviarInvitacionUseCase";
import { ResponderInvitacionUseCase } from "./application/useCases/ResponderInvitacionUseCase";
import { InvitacionController } from "./infrastructure/http/controllers/InvitacionController";
import { RespuestaInvitacionController } from "./infrastructure/http/controllers/RespuestaInvitacionController";
import { InvitacionRouter } from "./infrastructure/http/routes/InvitacionRouter";
import { RespuestaInvitacionRouter } from "./infrastructure/http/routes/RespuestaInvitacionRouter";
import { ORGANIZACION_TOKENS } from "./infrastructure/tokens";
import { PrismaInvitacionRepository } from "./infrastructure/repository/PrismaInvitacionRepository";
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
	register(container) {
		container.set(
			ORGANIZACION_TOKENS.AccesoOrganizacion,
			() => new AccesoOrganizacionService(new PrismaOrganizacionRepository()),
		);
	},
	mount(app, container) {
		const repo = new PrismaOrganizacionRepository();
		const almacenamiento = container.get(TOKENS.Almacenamiento);
		const authMiddleware = container.get(AUTH_TOKENS.AuthMiddleware);
		const guard = container.get(TOKENS.PermisoGuard);
		const uow = container.get(TOKENS.UnitOfWork);
		const eventBus = container.get(TOKENS.EventBus);
		const router = new OrganizacionRouter(
			authMiddleware,
			guard,
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

		app.route(
			"/api/organizaciones",
			new MiembroRouter(
				authMiddleware,
				guard,
				new MiembroController({
					obtenerTodos: new ObtenerMiembrosUseCase(repo),
					quitar: new QuitarMiembroUseCase(repo, eventBus, uow),
					delegar: new DelegarAdministracionUseCase(repo, eventBus, uow),
				}),
			).router,
		);

		const roles = new PrismaRolOrganizacionRepository();
		app.route(
			"/api/organizaciones",
			new RolRouter(
				authMiddleware,
				guard,
				new RolController({
					obtenerTodos: new ObtenerRolesUseCase(repo, roles),
					crear: new CrearRolUseCase(repo, roles),
					actualizar: new ActualizarRolUseCase(repo, roles),
					eliminar: new EliminarRolUseCase(repo, roles),
					asignar: new AsignarRolesUseCase(repo, roles),
				}),
			).router,
		);

		const invitaciones = new PrismaInvitacionRepository();
		const emisor = new EmisorInvitaciones(
			container.get(TOKENS.Mailer),
			env.APP_URL,
		);
		app.route(
			"/api/organizaciones",
			new InvitacionRouter(
				authMiddleware,
				guard,
				new InvitacionController({
					invitar: new InvitarUseCase(repo, invitaciones, emisor),
					obtenerTodas: new ObtenerInvitacionesUseCase(repo, invitaciones),
					reenviar: new ReenviarInvitacionUseCase(repo, invitaciones, emisor),
					cancelar: new CancelarInvitacionUseCase(repo, invitaciones),
				}),
			).router,
		);
		app.route(
			"/api/invitaciones",
			new RespuestaInvitacionRouter(
				authMiddleware,
				guard,
				new RespuestaInvitacionController({
					consultar: new ConsultarInvitacionUseCase(invitaciones),
					responder: new ResponderInvitacionUseCase(repo, invitaciones, uow),
				}),
			).router,
		);
	},
};
