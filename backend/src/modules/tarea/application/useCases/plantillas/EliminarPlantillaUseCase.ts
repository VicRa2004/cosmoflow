import type { AccesoOrganizacion } from "@/modules/organizacion";
import { PlantillaNoEncontradaError } from "../../../domain/error/PlantillaNoEncontradaError";
import type { PlantillaTareaRepository } from "../../../domain/repository/PlantillaTareaRepository";
import {
	type AmbitoPlantilla,
	resolverDuenoPlantilla,
} from "./resolverDuenoPlantilla";

export class EliminarPlantillaUseCase {
	constructor(
		private readonly repo: PlantillaTareaRepository,
		private readonly acceso: AccesoOrganizacion,
	) {}

	async ejecutar(ambito: AmbitoPlantilla, id: number): Promise<void> {
		const dueno = await resolverDuenoPlantilla(this.acceso, ambito, true);
		if (!(await this.repo.eliminar(dueno, id))) {
			throw new PlantillaNoEncontradaError();
		}
	}
}
