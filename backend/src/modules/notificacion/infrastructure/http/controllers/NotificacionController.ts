import type { Context } from "hono";
import { BaseController } from "@/core/shared/infrastructure/http/base.controller";
import { validate } from "@/core/shared/infrastructure/libs/validate";
import type { AuthEnv } from "@/modules/auth";
import type { ActualizarPreferenciasUseCase } from "../../../application/useCases/ActualizarPreferenciasUseCase";
import type { ObtenerPreferenciasUseCase } from "../../../application/useCases/ObtenerPreferenciasUseCase";
import { preferenciasSchema } from "../schemas/notificacionSchemas";

/** Preferencias del usuario autenticado: cada uno solo ve y cambia las suyas. */
export class NotificacionController extends BaseController {
	constructor(
		private readonly useCases: {
			obtenerPreferencias: ObtenerPreferenciasUseCase;
			actualizarPreferencias: ActualizarPreferenciasUseCase;
		},
	) {
		super();
	}

	obtenerPreferencias = (c: Context<AuthEnv>): Promise<Response> =>
		this.executeSafely(c, async () =>
			this.ok(
				c,
				await this.useCases.obtenerPreferencias.ejecutar(c.get("usuario").id),
			),
		);

	actualizarPreferencias = (c: Context<AuthEnv>): Promise<Response> =>
		this.executeSafely(c, async () => {
			const preferencias = validate(preferenciasSchema, await c.req.json());
			return this.ok(
				c,
				await this.useCases.actualizarPreferencias.ejecutar(
					c.get("usuario").id,
					preferencias,
				),
			);
		});
}
