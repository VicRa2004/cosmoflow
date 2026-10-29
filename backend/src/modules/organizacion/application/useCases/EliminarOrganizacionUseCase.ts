import type { OrganizacionRepository } from "../../domain/repository/OrganizacionRepository";
import { buscarConPermiso } from "./buscarConPermiso";

export class EliminarOrganizacionUseCase {
	constructor(
		private readonly organizacionRepository: OrganizacionRepository,
	) {}

	async ejecutar(usuarioId: number, id: number): Promise<void> {
		await buscarConPermiso(this.organizacionRepository, usuarioId, id, "admin");
		await this.organizacionRepository.eliminar(id);
	}
}
