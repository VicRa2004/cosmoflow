import type { Context } from "hono";
import { BaseController } from "@/core/shared/infrastructure/http/base.controller";
import { validate } from "@/core/shared/infrastructure/libs/validate";
import type { AuthEnv } from "@/modules/auth";
import type { MarcarNotificacionLeidaUseCase } from "../../../application/useCases/MarcarNotificacionLeidaUseCase";
import type { MarcarTodasNotificacionesLeidasUseCase } from "../../../application/useCases/MarcarTodasNotificacionesLeidasUseCase";
import type { ObtenerNotificacionesUseCase } from "../../../application/useCases/ObtenerNotificacionesUseCase";
import {
	notificacionIdParamSchema,
	obtenerNotificacionesSchema,
} from "../schemas/notificacionSchemas";

/** Bandeja de notificaciones dentro de la app (campana, #51). */
export class BandejaNotificacionController extends BaseController {
	constructor(
		private readonly useCases: {
			obtener: ObtenerNotificacionesUseCase;
			marcarLeida: MarcarNotificacionLeidaUseCase;
			marcarTodasLeidas: MarcarTodasNotificacionesLeidasUseCase;
		},
	) {
		super();
	}

	obtenerTodos = (c: Context<AuthEnv>): Promise<Response> =>
		this.executeSafely(c, async () => {
			const filtros = validate(obtenerNotificacionesSchema, c.req.query());
			return this.ok(
				c,
				await this.useCases.obtener.ejecutar(c.get("usuario").id, filtros),
			);
		});

	marcarLeida = (c: Context<AuthEnv>): Promise<Response> =>
		this.executeSafely(c, async () => {
			const { id } = validate(notificacionIdParamSchema, c.req.param());
			await this.useCases.marcarLeida.ejecutar(c.get("usuario").id, id);
			return c.body(null, 204);
		});

	marcarTodasLeidas = (c: Context<AuthEnv>): Promise<Response> =>
		this.executeSafely(c, async () => {
			await this.useCases.marcarTodasLeidas.ejecutar(c.get("usuario").id);
			return c.body(null, 204);
		});
}
