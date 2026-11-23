import type { AccesoOrganizacion } from "@/modules/organizacion";
import type { DuenoPlantilla } from "../../../domain/PlantillaTarea";

/** Quién pide y, si es de una organización, cuál (`/api/organizaciones/{id}/plantillas`). */
export interface AmbitoPlantilla {
	usuarioId: number;
	organizacionId?: number;
}

/**
 * Personal: el dueño es quien pide. De organización: hay que ser miembro para leer
 * y tener `plantillas:gestionar` para escribir (404/403 si no), como los tags.
 */
export async function resolverDuenoPlantilla(
	acceso: AccesoOrganizacion,
	{ usuarioId, organizacionId }: AmbitoPlantilla,
	escritura: boolean,
): Promise<DuenoPlantilla> {
	if (organizacionId === undefined) return { usuarioId };
	await acceso.exigir(
		usuarioId,
		organizacionId,
		escritura ? "plantillas:gestionar" : undefined,
	);
	return { organizacionId };
}
