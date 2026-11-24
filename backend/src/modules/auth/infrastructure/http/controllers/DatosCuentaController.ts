import type { Context } from "hono";
import { BaseController } from "@/core/shared/infrastructure/http/base.controller";
import { validate } from "@/core/shared/infrastructure/libs/validate";
import type { EliminarCuentaUseCase } from "../../../application/useCases/EliminarCuentaUseCase";
import type { ExportarDatosUseCase } from "../../../application/useCases/ExportarDatosUseCase";
import type { AuthEnv } from "../middlewares/authMiddleware";
import { clearRefreshTokenCookie } from "../refreshTokenCookie";
import { eliminarCuentaSchema } from "../schemas/cuentaSchemas";

/** Exportar mis datos y eliminar mi cuenta (Perfil → General). */
export class DatosCuentaController extends BaseController {
	constructor(
		private readonly useCases: {
			exportar: ExportarDatosUseCase;
			eliminar: EliminarCuentaUseCase;
		},
	) {
		super();
	}

	exportar = (c: Context<AuthEnv>): Promise<Response> =>
		this.executeSafely(c, async () =>
			this.ok(c, await this.useCases.exportar.ejecutar(c.get("usuario").id)),
		);

	eliminar = (c: Context<AuthEnv>): Promise<Response> =>
		this.executeSafely(c, async () => {
			const { password } = validate(eliminarCuentaSchema, await c.req.json());
			await this.useCases.eliminar.ejecutar(c.get("usuario").id, password);
			clearRefreshTokenCookie(c);
			return c.body(null, 204);
		});
}
