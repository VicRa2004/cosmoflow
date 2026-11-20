import type { Context } from "hono";
import { BaseController } from "@/core/shared/infrastructure/http/base.controller";
import { validate } from "@/core/shared/infrastructure/libs/validate";
import type { AuthEnv } from "@/modules/auth";
import type { EliminarNotaDefinitivoUseCase } from "../../../application/useCases/EliminarNotaDefinitivoUseCase";
import type { ObtenerPapeleraNotasUseCase } from "../../../application/useCases/ObtenerPapeleraNotasUseCase";
import type { RestaurarNotaUseCase } from "../../../application/useCases/RestaurarNotaUseCase";
import { notaIdSchema, papeleraNotasSchema } from "../schemas/notaSchemas";

/** Notas borradas: listarlas, restaurarlas o borrarlas del todo. */
export class PapeleraNotaController extends BaseController {
	constructor(
		private readonly useCases: {
			obtenerTodos: ObtenerPapeleraNotasUseCase;
			restaurar: RestaurarNotaUseCase;
			eliminar: EliminarNotaDefinitivoUseCase;
		},
	) {
		super();
	}

	obtenerTodos = (c: Context<AuthEnv>): Promise<Response> =>
		this.executeSafely(c, async () => {
			const dto = validate(papeleraNotasSchema, c.req.query());
			return this.ok(
				c,
				await this.useCases.obtenerTodos.ejecutar(c.get("usuario").id, dto),
			);
		});

	restaurar = (c: Context<AuthEnv>): Promise<Response> =>
		this.executeSafely(c, async () => {
			const { id } = validate(notaIdSchema, c.req.param());
			await this.useCases.restaurar.ejecutar(c.get("usuario").id, id);
			return c.body(null, 204);
		});

	eliminar = (c: Context<AuthEnv>): Promise<Response> =>
		this.executeSafely(c, async () => {
			const { id } = validate(notaIdSchema, c.req.param());
			await this.useCases.eliminar.ejecutar(c.get("usuario").id, id);
			return c.body(null, 204);
		});
}
