import { token } from "@/core/shared/infrastructure/di/DependencyContainer";
import type { BajaEquipo } from "../domain/BajaEquipo";
import type { TareasEquipo } from "../domain/TareasEquipo";

/** Lo que `equipo` comparte con otros módulos. Se registra en `equipo/module.ts`. */
export const EQUIPO_TOKENS = {
	/** Por defecto no bloquea; `proyecto` lo sustituye. */
	BajaEquipo: token<BajaEquipo>("BajaEquipo"),
	TareasEquipo: token<TareasEquipo>("TareasEquipo"),
} as const;
