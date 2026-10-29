import { token } from "@/core/shared/infrastructure/di/DependencyContainer";
import type { TareasProyecto } from "../domain/TareasProyecto";

/** Lo que `proyecto` comparte con otros módulos. Se registra en `proyecto/module.ts`. */
export const PROYECTO_TOKENS = {
	TareasProyecto: token<TareasProyecto>("TareasProyecto"),
} as const;
