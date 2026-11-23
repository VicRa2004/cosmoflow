import type { AccesoOrganizacion } from "@/modules/organizacion";
import type { PlantillaTarea } from "../../../domain/PlantillaTarea";
import type { PlantillaTareaRepository } from "../../../domain/repository/PlantillaTareaRepository";
import {
	type AmbitoPlantilla,
	resolverDuenoPlantilla,
} from "./resolverDuenoPlantilla";

export class ObtenerPlantillasUseCase {
	constructor(
		private readonly repo: PlantillaTareaRepository,
		private readonly acceso: AccesoOrganizacion,
	) {}

	async ejecutar(ambito: AmbitoPlantilla): Promise<PlantillaTarea[]> {
		return this.repo.buscar(
			await resolverDuenoPlantilla(this.acceso, ambito, false),
		);
	}
}
