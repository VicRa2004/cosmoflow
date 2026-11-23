import type { AccesoOrganizacion } from "@/modules/organizacion";
import { PlantillaNoEncontradaError } from "../../../domain/error/PlantillaNoEncontradaError";
import type {
	DatosPlantilla,
	PlantillaTarea,
} from "../../../domain/PlantillaTarea";
import type { PlantillaTareaRepository } from "../../../domain/repository/PlantillaTareaRepository";
import {
	type AmbitoPlantilla,
	resolverDuenoPlantilla,
} from "./resolverDuenoPlantilla";

export class ActualizarPlantillaUseCase {
	constructor(
		private readonly repo: PlantillaTareaRepository,
		private readonly acceso: AccesoOrganizacion,
	) {}

	async ejecutar(
		ambito: AmbitoPlantilla,
		id: number,
		cambios: Partial<DatosPlantilla>,
	): Promise<PlantillaTarea> {
		const dueno = await resolverDuenoPlantilla(this.acceso, ambito, true);
		const plantilla = await this.repo.actualizar(dueno, id, cambios);
		if (!plantilla) throw new PlantillaNoEncontradaError();
		return plantilla;
	}
}
