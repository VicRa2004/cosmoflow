import type { Context } from "hono";
import type { ActualizarTareaUseCase } from "../../../application/useCases/ActualizarTareaUseCase";
import type { CrearTareaUseCase } from "../../../application/useCases/CrearTareaUseCase";
import type { EliminarTareaUseCase } from "../../../application/useCases/EliminarTareaUseCase";
import type { ObtenerTareaUseCase } from "../../../application/useCases/ObtenerTareaUseCase";
import type { ObtenerTareasUseCase } from "../../../application/useCases/ObtenerTareasUseCase";
import {
	actualizarTareaSchema,
	crearTareaSchema,
	obtenerTareasSchema,
	tareaIdSchema,
} from "../schemas/tareaSchemas";
import { BaseController } from "@/core/shared/infrastructure/http/base.controller";
import { validate } from "@/core/shared/infrastructure/libs/validate";
import type { AuthEnv } from "@/modules/auth";

/** Cada handler opera sobre las tareas del usuario autenticado. */
export class TareaController extends BaseController {
	// Objeto con nombres y no posicional: varios casos de uso tienen la misma forma (`ejecutar(id)`).
	constructor(
		private readonly useCases: {
			crear: CrearTareaUseCase;
			obtenerTodos: ObtenerTareasUseCase;
			obtenerUno: ObtenerTareaUseCase;
			actualizar: ActualizarTareaUseCase;
			eliminar: EliminarTareaUseCase;
		},
	) {
		super();
	}

	crear = (c: Context<AuthEnv>): Promise<Response> =>
		this.executeSafely(c, async () => {
			const dto = validate(crearTareaSchema, await c.req.json());
			return this.created(
				c,
				await this.useCases.crear.ejecutar(c.get("usuario").id, dto),
			);
		});

	obtenerTodos = (c: Context<AuthEnv>): Promise<Response> =>
		this.executeSafely(c, async () => {
			const dto = validate(obtenerTareasSchema, c.req.query());
			return this.ok(
				c,
				await this.useCases.obtenerTodos.ejecutar(c.get("usuario").id, dto),
			);
		});

	obtenerUno = (c: Context<AuthEnv>): Promise<Response> =>
		this.executeSafely(c, async () => {
			const { id } = validate(tareaIdSchema, c.req.param());
			return this.ok(
				c,
				await this.useCases.obtenerUno.ejecutar(c.get("usuario").id, id),
			);
		});

	actualizar = (c: Context<AuthEnv>): Promise<Response> =>
		this.executeSafely(c, async () => {
			const { id } = validate(tareaIdSchema, c.req.param());
			const dto = validate(actualizarTareaSchema, await c.req.json());
			return this.ok(
				c,
				await this.useCases.actualizar.ejecutar(c.get("usuario").id, id, dto),
			);
		});

	eliminar = (c: Context<AuthEnv>): Promise<Response> =>
		this.executeSafely(c, async () => {
			const { id } = validate(tareaIdSchema, c.req.param());
			await this.useCases.eliminar.ejecutar(c.get("usuario").id, id);
			return c.body(null, 204);
		});
}
