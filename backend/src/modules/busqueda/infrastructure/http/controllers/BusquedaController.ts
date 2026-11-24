import type { Context } from "hono";
import { BaseController } from "@/core/shared/infrastructure/http/base.controller";
import { validate } from "@/core/shared/infrastructure/libs/validate";
import type { AuthEnv } from "@/modules/auth";
import type { BuscarUseCase } from "../../../application/useCases/BuscarUseCase";
import { buscarSchema } from "../schemas/busquedaSchemas";

export class BusquedaController extends BaseController {
	constructor(private readonly buscar: BuscarUseCase) {
		super();
	}

	ejecutar = (c: Context<AuthEnv>): Promise<Response> =>
		this.executeSafely(c, async () => {
			const { q } = validate(buscarSchema, c.req.query());
			return this.ok(c, await this.buscar.ejecutar(c.get("usuario").id, q));
		});
}
