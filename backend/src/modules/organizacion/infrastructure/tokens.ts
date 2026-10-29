import type { AccesoOrganizacion } from "../domain/AccesoOrganizacion";
import type { SalidaMiembro } from "../domain/SalidaMiembro";
import { token } from "@/core/shared/infrastructure/di/DependencyContainer";

/** Lo que `organizacion` comparte con otros módulos. Se registra en `organizacion/module.ts`. */
export const ORGANIZACION_TOKENS = {
	AccesoOrganizacion: token<AccesoOrganizacion>("AccesoOrganizacion"),
	/** Por defecto no bloquea; `equipo` lo sustituye. */
	SalidaMiembro: token<SalidaMiembro>("SalidaMiembro"),
} as const;
