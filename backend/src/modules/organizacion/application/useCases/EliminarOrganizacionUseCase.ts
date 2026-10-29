import type { OrganizacionRepository } from "../../domain/repository/OrganizacionRepository";
import { buscarComoAdmin } from "./buscarComoAdmin";

export class EliminarOrganizacionUseCase {
	constructor(
		private readonly organizacionRepository: OrganizacionRepository,
	) {}

	async ejecutar(usuarioId: number, id: number): Promise<void> {
		await buscarComoAdmin(this.organizacionRepository, usuarioId, id);
		await this.organizacionRepository.eliminar(id);
	}
}
