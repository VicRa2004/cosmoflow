import type { Context } from "hono";
import { BaseController } from "@/core/shared/infrastructure/http/base.controller";
import { validate } from "@/core/shared/infrastructure/libs/validate";
import type { AuthEnv } from "@/modules/auth";
import type { EliminarDispositivoPushUseCase } from "../../../application/useCases/EliminarDispositivoPushUseCase";
import type { ObtenerEstadoMovilUseCase } from "../../../application/useCases/ObtenerEstadoMovilUseCase";
import type { RegistrarDispositivoPushUseCase } from "../../../application/useCases/RegistrarDispositivoPushUseCase";
import {
	eliminarDispositivoPushSchema,
	registrarDispositivoPushSchema,
} from "../schemas/notificacionSchemas";

/** Estado del canal móvil y alta/baja de tokens push del usuario autenticado. */
export class DispositivoPushController extends BaseController {
	constructor(
		private readonly useCases: {
			estadoMovil: ObtenerEstadoMovilUseCase;
			registrarDispositivo: RegistrarDispositivoPushUseCase;
			eliminarDispositivo: EliminarDispositivoPushUseCase;
		},
	) {
		super();
	}

	estado = (c: Context<AuthEnv>): Promise<Response> =>
		this.executeSafely(c, async () =>
			this.ok(c, await this.useCases.estadoMovil.ejecutar(c.get("usuario").id)),
		);

	registrar = (c: Context<AuthEnv>): Promise<Response> =>
		this.executeSafely(c, async () => {
			const dto = validate(registrarDispositivoPushSchema, await c.req.json());
			await this.useCases.registrarDispositivo.ejecutar(
				c.get("usuario").id,
				dto,
			);
			return c.body(null, 204);
		});

	eliminar = (c: Context<AuthEnv>): Promise<Response> =>
		this.executeSafely(c, async () => {
			const { token } = validate(
				eliminarDispositivoPushSchema,
				await c.req.json(),
			);
			await this.useCases.eliminarDispositivo.ejecutar(
				c.get("usuario").id,
				token,
			);
			return c.body(null, 204);
		});
}
