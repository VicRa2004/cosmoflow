import type {
	DatosPlantilla,
	DuenoPlantilla,
	PlantillaTarea,
} from "../PlantillaTarea";

/** Lecturas y escrituras acotadas al dueño: la de otro no existe para quien pide (404). */
export interface PlantillaTareaRepository {
	/** Por nombre. */
	buscar(dueno: DuenoPlantilla): Promise<PlantillaTarea[]>;
	crear(dueno: DuenoPlantilla, datos: DatosPlantilla): Promise<PlantillaTarea>;
	/** `null` si no es de ese dueño. */
	actualizar(
		dueno: DuenoPlantilla,
		id: number,
		cambios: Partial<DatosPlantilla>,
	): Promise<PlantillaTarea | null>;
	/** `false` si no es de ese dueño. */
	eliminar(dueno: DuenoPlantilla, id: number): Promise<boolean>;
}
