import { createContext, useContext } from "react";
import type { OrganizacionDto } from "../api/organizacionesApi";

export const OrganizacionContext = createContext<OrganizacionDto | null>(null);

/** La organización de `OrganizacionLayout`, ya cargada, para las rutas hijas. */
export function useOrganizacionActual(): OrganizacionDto {
	const organizacion = useContext(OrganizacionContext);
	if (!organizacion) throw new Error("Fuera de OrganizacionLayout");
	return organizacion;
}
