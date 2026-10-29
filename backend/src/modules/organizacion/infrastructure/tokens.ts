import type { AccesoOrganizacion } from "../domain/AccesoOrganizacion";
import { token } from "@/core/shared/infrastructure/di/DependencyContainer";

/** Lo que `organizacion` comparte con otros módulos. Se registra en `organizacion/module.ts`. */
export const ORGANIZACION_TOKENS = {
	AccesoOrganizacion: token<AccesoOrganizacion>("AccesoOrganizacion"),
} as const;
