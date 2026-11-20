import type { Context } from "hono";
import { BaseController } from "@/core/shared/infrastructure/http/base.controller";
import { validate } from "@/core/shared/infrastructure/libs/validate";
import type { AuthEnv } from "@/modules/auth";
import type { EliminarTareaDefinitivoUseCase } from "../../../application/useCases/EliminarTareaDefinitivoUseCase";
import type { ObtenerPapeleraTareasUseCase } from "../../../application/useCases/ObtenerPapeleraTareasUseCase";
import type { RestaurarTareaUseCase } from "../../../application/useCases/RestaurarTareaUseCase";
import { paginacionSchema, tareaIdSchema } from "../schemas/tareaSchemas";

/** Tareas borradas: listarlas, restaurarlas o borrarlas del todo. */
export class PapeleraTareaController extends BaseController {
	constructor(
		private readonly useCases: {
			obtenerTodos: ObtenerPapeleraTareasUseCase;
			restaurar: RestaurarTareaUseCase;
			eliminar: EliminarTareaDefinitivoUseCase;
		},
	) {
		super();
	}

	obtenerTodos = (c: Context<AuthEnv>): Promise<Response> =>
		this.executeSafely(c, async () => {
			const dto = validate(paginacionSchema, c.req.query());
			return this.ok(
				c,
				await this.useCases.obtenerTodos.ejecutar(c.get("usuario").id, dto),
			);
		});

	restaurar = (c: Context<AuthEnv>): Promise<Response> =>
		this.executeSafely(c, async () => {
			const { id } = validate(tareaIdSchema, c.req.param());
			await this.useCases.restaurar.ejecutar(c.get("usuario").id, id);
			return c.body(null, 204);
		});

	eliminar = (c: Context<AuthEnv>): Promise<Response> =>
		this.executeSafely(c, async () => {
			const { id } = validate(tareaIdSchema, c.req.param());
			await this.useCases.eliminar.ejecutar(c.get("usuario").id, id);
			return c.body(null, 204);
		});
}
