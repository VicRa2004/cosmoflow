import type { AccesoOrganizacion } from "@/modules/organizacion";
import type {
	DatosPlantilla,
	PlantillaTarea,
} from "../../../domain/PlantillaTarea";
import type { PlantillaTareaRepository } from "../../../domain/repository/PlantillaTareaRepository";
import {
	type AmbitoPlantilla,
	resolverDuenoPlantilla,
} from "./resolverDuenoPlantilla";

export class CrearPlantillaUseCase {
	constructor(
		private readonly repo: PlantillaTareaRepository,
		private readonly acceso: AccesoOrganizacion,
	) {}

	async ejecutar(
		ambito: AmbitoPlantilla,
		datos: DatosPlantilla,
	): Promise<PlantillaTarea> {
		return this.repo.crear(
			await resolverDuenoPlantilla(this.acceso, ambito, true),
			datos,
		);
	}
}
