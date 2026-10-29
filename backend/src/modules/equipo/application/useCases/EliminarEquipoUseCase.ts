import type { AccesoOrganizacion } from "@/modules/organizacion";
import type { EquipoRepository } from "../../domain/repository/EquipoRepository";
import type { AmbitoEquipo } from "../dtos/EquipoDto";
import { buscarEquipo } from "./buscarEquipo";

export class EliminarEquipoUseCase {
	constructor(
		private readonly equipoRepository: EquipoRepository,
		private readonly acceso: AccesoOrganizacion,
	) {}

	async ejecutar(
		{ usuarioId, organizacionId }: AmbitoEquipo,
		id: number,
	): Promise<void> {
		await this.acceso.exigir(usuarioId, organizacionId, "equipos:eliminar");
		await buscarEquipo(this.equipoRepository, organizacionId, id);
		await this.equipoRepository.eliminar(organizacionId, id);
	}
}
