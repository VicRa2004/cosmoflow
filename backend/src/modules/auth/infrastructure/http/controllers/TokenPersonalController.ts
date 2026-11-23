import type { Context } from "hono";
import { BaseController } from "@/core/shared/infrastructure/http/base.controller";
import { validate } from "@/core/shared/infrastructure/libs/validate";
import type { CambiarAlcancesTokenPersonalUseCase } from "../../../application/useCases/CambiarAlcancesTokenPersonalUseCase";
import type { CrearTokenPersonalUseCase } from "../../../application/useCases/CrearTokenPersonalUseCase";
import type { ObtenerTokensPersonalesUseCase } from "../../../application/useCases/ObtenerTokensPersonalesUseCase";
import type { RevocarTokenPersonalUseCase } from "../../../application/useCases/RevocarTokenPersonalUseCase";
import type { AuthEnv } from "../middlewares/authMiddleware";
import {
	cambiarAlcancesSchema,
	crearTokenPersonalSchema,
	tokenPersonalIdSchema,
} from "../schemas/tokenPersonalSchemas";

export class TokenPersonalController extends BaseController {
	constructor(
		private readonly useCases: {
			crear: CrearTokenPersonalUseCase;
			obtenerTodos: ObtenerTokensPersonalesUseCase;
			revocar: RevocarTokenPersonalUseCase;
			cambiarAlcances: CambiarAlcancesTokenPersonalUseCase;
		},
	) {
		super();
	}

	crear = (c: Context<AuthEnv>): Promise<Response> =>
		this.executeSafely(c, async () => {
			const { nombre, alcances } = validate(
				crearTokenPersonalSchema,
				await c.req.json(),
			);
			return this.created(
				c,
				await this.useCases.crear.ejecutar(
					c.get("usuario").id,
					nombre,
					alcances,
				),
			);
		});

	obtenerTodos = (c: Context<AuthEnv>): Promise<Response> =>
		this.executeSafely(c, async () =>
			this.ok(
				c,
				await this.useCases.obtenerTodos.ejecutar(c.get("usuario").id),
			),
		);

	cambiarAlcances = (c: Context<AuthEnv>): Promise<Response> =>
		this.executeSafely(c, async () => {
			const { id } = validate(tokenPersonalIdSchema, c.req.param());
			const { alcances } = validate(cambiarAlcancesSchema, await c.req.json());
			await this.useCases.cambiarAlcances.ejecutar(
				c.get("usuario").id,
				id,
				alcances,
			);
			return c.body(null, 204);
		});

	revocar = (c: Context<AuthEnv>): Promise<Response> =>
		this.executeSafely(c, async () => {
			const { id } = validate(tokenPersonalIdSchema, c.req.param());
			await this.useCases.revocar.ejecutar(c.get("usuario").id, id);
			return c.body(null, 204);
		});
}
