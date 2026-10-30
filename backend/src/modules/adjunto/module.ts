import type { AppModule } from "@/core/shared/infrastructure/di/AppModule";
import { TOKENS } from "@/core/shared/infrastructure/di/tokens";
import { AUTH_TOKENS } from "@/modules/auth";
import { EQUIPO_TOKENS } from "@/modules/equipo";
import { ORGANIZACION_TOKENS } from "@/modules/organizacion";
import { PROYECTO_TOKENS } from "@/modules/proyecto";
import { MiembrosAmbito } from "./application/services/MiembrosAmbito";
import { ADJUNTO_TOKENS } from "./infrastructure/tokens";
import { ObtenerAdjuntoUseCase } from "./application/useCases/ObtenerAdjuntoUseCase";
import { SubirAdjuntoUseCase } from "./application/useCases/SubirAdjuntoUseCase";
import { AdjuntoController } from "./infrastructure/http/controllers/AdjuntoController";
import { AdjuntoRouter } from "./infrastructure/http/routes/AdjuntoRouter";
import { PrismaAdjuntoRepository } from "./infrastructure/repository/PrismaAdjuntoRepository";

export const adjuntoModule: AppModule = {
	register(container) {
		container.set(
			ADJUNTO_TOKENS.CompartirAdjuntos,
			() => new PrismaAdjuntoRepository(),
		);
	},
	mount(app, container) {
		const repo = new PrismaAdjuntoRepository();
		const almacenamiento = container.get(TOKENS.Almacenamiento);
		const eventBus = container.get(TOKENS.EventBus);
		for (const evento of ["equipo.eliminado", "proyecto.eliminado"]) {
			eventBus.subscribe(evento, (e) => {
				const { organizacionId, ...grupo } = e.data as {
					organizacionId: number;
				} & ({ equipoId: number } | { proyectoId: number });
				return repo.pasarAOrganizacion(organizacionId, grupo);
			});
		}
		const miembros = new MiembrosAmbito(
			container.get(EQUIPO_TOKENS.TareasEquipo),
			container.get(PROYECTO_TOKENS.TareasProyecto),
			container.get(ORGANIZACION_TOKENS.TareasOrganizacion),
		);
		const router = new AdjuntoRouter(
			container.get(AUTH_TOKENS.AuthMiddleware),
			container.get(TOKENS.PermisoGuard),
			new AdjuntoController({
				subir: new SubirAdjuntoUseCase(repo, almacenamiento, miembros),
				obtener: new ObtenerAdjuntoUseCase(repo, almacenamiento, miembros),
			}),
		);
		app.route("/api/adjuntos", router.router);
	},
};
