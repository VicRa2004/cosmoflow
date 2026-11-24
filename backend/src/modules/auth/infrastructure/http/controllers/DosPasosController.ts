import type { Context } from "hono";
import { BaseController } from "@/core/shared/infrastructure/http/base.controller";
import { validate } from "@/core/shared/infrastructure/libs/validate";
import type { ActivarDosPasosUseCase } from "../../../application/useCases/ActivarDosPasosUseCase";
import type { DesactivarDosPasosUseCase } from "../../../application/useCases/DesactivarDosPasosUseCase";
import type { IniciarDosPasosUseCase } from "../../../application/useCases/IniciarDosPasosUseCase";
import type { ObtenerDosPasosUseCase } from "../../../application/useCases/ObtenerDosPasosUseCase";
import type { AuthEnv } from "../middlewares/authMiddleware";
import {
	activarDosPasosSchema,
	desactivarDosPasosSchema,
} from "../schemas/authSchemas";

/** Verificación en dos pasos del usuario autenticado (Perfil → Seguridad). */
export class DosPasosController extends BaseController {
	constructor(
		private readonly useCases: {
			obtener: ObtenerDosPasosUseCase;
			iniciar: IniciarDosPasosUseCase;
			activar: ActivarDosPasosUseCase;
			desactivar: DesactivarDosPasosUseCase;
		},
	) {
		super();
	}

	obtener = (c: Context<AuthEnv>): Promise<Response> =>
		this.executeSafely(c, async () =>
			this.ok(c, await this.useCases.obtener.ejecutar(c.get("usuario").id)),
		);

	iniciar = (c: Context<AuthEnv>): Promise<Response> =>
		this.executeSafely(c, async () =>
			this.ok(c, await this.useCases.iniciar.ejecutar(c.get("usuario").id)),
		);

	activar = (c: Context<AuthEnv>): Promise<Response> =>
		this.executeSafely(c, async () => {
			const { codigo } = validate(activarDosPasosSchema, await c.req.json());
			const codigosRecuperacion = await this.useCases.activar.ejecutar(
				c.get("usuario").id,
				codigo,
			);
			return this.ok(c, { codigosRecuperacion });
		});

	desactivar = (c: Context<AuthEnv>): Promise<Response> =>
		this.executeSafely(c, async () => {
			const dto = validate(desactivarDosPasosSchema, await c.req.json());
			await this.useCases.desactivar.ejecutar(c.get("usuario").id, dto);
			return this.ok(c, { mensaje: "Verificación en dos pasos desactivada" });
		});
}
