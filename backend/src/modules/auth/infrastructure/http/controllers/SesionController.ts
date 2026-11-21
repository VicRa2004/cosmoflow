import type { Context } from "hono";
import { BaseController } from "@/core/shared/infrastructure/http/base.controller";
import { validate } from "@/core/shared/infrastructure/libs/validate";
import type { ObtenerSesionesUseCase } from "../../../application/useCases/ObtenerSesionesUseCase";
import type { RevocarSesionUseCase } from "../../../application/useCases/RevocarSesionUseCase";
import type { AuthEnv } from "../middlewares/authMiddleware";
import {
	clearRefreshTokenCookie,
	leerRefreshToken,
} from "../refreshTokenCookie";
import { sesionIdSchema } from "../schemas/authSchemas";

/** Lista y revoca las sesiones activas (refresh tokens) del usuario autenticado. */
export class SesionController extends BaseController {
	constructor(
		private readonly useCases: {
			obtenerTodos: ObtenerSesionesUseCase;
			revocar: RevocarSesionUseCase;
		},
	) {
		super();
	}

	obtenerTodos = (c: Context<AuthEnv>): Promise<Response> =>
		this.executeSafely(c, async () => {
			const sesiones = await this.useCases.obtenerTodos.ejecutar(
				c.get("usuario").id,
				leerRefreshToken(c),
			);
			return this.ok(c, sesiones);
		});

	revocar = (c: Context<AuthEnv>): Promise<Response> =>
		this.executeSafely(c, async () => {
			const { id } = validate(sesionIdSchema, c.req.param());
			const { isActual } = await this.useCases.revocar.ejecutar(
				c.get("usuario").id,
				id,
				leerRefreshToken(c),
			);
			if (isActual) {
				clearRefreshTokenCookie(c);
			}
			return c.body(null, 204);
		});
}
