import { token } from "@/core/shared/infrastructure/di/DependencyContainer";
import type { CompartirAdjuntos } from "../domain/CompartirAdjuntos";

/** Lo que `adjunto` comparte con otros módulos. Se registra en `adjunto/module.ts`. */
export const ADJUNTO_TOKENS = {
	CompartirAdjuntos: token<CompartirAdjuntos>("CompartirAdjuntos"),
} as const;
