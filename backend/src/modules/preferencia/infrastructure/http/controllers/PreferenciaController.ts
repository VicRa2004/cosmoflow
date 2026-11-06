import type { Context } from "hono";
import { BaseController } from "@/core/shared/infrastructure/http/base.controller";
import { validate } from "@/core/shared/infrastructure/libs/validate";
import type { AuthEnv } from "@/modules/auth";
import type { ActualizarPreferenciasInterfazUseCase } from "../../../application/useCases/ActualizarPreferenciasInterfazUseCase";
import type { ObtenerPreferenciasInterfazUseCase } from "../../../application/useCases/ObtenerPreferenciasInterfazUseCase";
import { actualizarPreferenciasInterfazSchema } from "../schemas/preferenciaSchemas";

/** Preferencias de interfaz del usuario autenticado (solo las suyas). */
export class PreferenciaController extends BaseController {
	constructor(
		private readonly useCases: {
			obtener: ObtenerPreferenciasInterfazUseCase;
			actualizar: ActualizarPreferenciasInterfazUseCase;
		},
	) {
		super();
	}

	obtener = (c: Context<AuthEnv>): Promise<Response> =>
		this.executeSafely(c, async () =>
			this.ok(c, await this.useCases.obtener.ejecutar(c.get("usuario").id)),
		);

	actualizar = (c: Context<AuthEnv>): Promise<Response> =>
		this.executeSafely(c, async () => {
			const cambios = validate(
				actualizarPreferenciasInterfazSchema,
				await c.req.json(),
			);
			return this.ok(
				c,
				await this.useCases.actualizar.ejecutar(c.get("usuario").id, cambios),
			);
		});
}
