import { token } from "@/core/shared/infrastructure/di/DependencyContainer";
import type { CrearTokenPersonalUseCase } from "../application/useCases/CrearTokenPersonalUseCase";
import type { AuthMiddleware } from "./http/middlewares/authMiddleware";

/** Lo que `auth` comparte con otros módulos. Se registra en `auth/module.ts`. */
export const AUTH_TOKENS = {
	AuthMiddleware: token<AuthMiddleware>("AuthMiddleware"),
	CrearTokenPersonal: token<CrearTokenPersonalUseCase>("CrearTokenPersonal"),
} as const;
