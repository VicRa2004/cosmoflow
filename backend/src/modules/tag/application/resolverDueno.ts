import type { AccesoOrganizacion } from "@/modules/organizacion";
import type { DuenoTag } from "../domain/Tag";

/** Quién pide y, si es de una organización, cuál (`/api/organizaciones/{id}/tags`). */
export interface AmbitoTag {
	usuarioId: number;
	organizacionId?: number;
}

/**
 * Personal: el dueño es quien pide. De organización: hay que ser miembro para leer
 * y tener `tags:gestionar` para escribir (404/403 si no, RN-90).
 */
export async function resolverDueno(
	acceso: AccesoOrganizacion,
	{ usuarioId, organizacionId }: AmbitoTag,
	escritura: boolean,
): Promise<DuenoTag> {
	if (organizacionId === undefined) return { usuarioId };
	await acceso.exigir(
		usuarioId,
		organizacionId,
		escritura ? "tags:gestionar" : undefined,
	);
	return { organizacionId };
}
