import type { Context } from "hono";
import { BaseController } from "@/core/shared/infrastructure/http/base.controller";
import { validate } from "@/core/shared/infrastructure/libs/validate";
import type { AuthEnv } from "@/modules/auth";
import type { ActualizarComentarioUseCase } from "../../../application/useCases/ActualizarComentarioUseCase";
import type { CrearComentarioUseCase } from "../../../application/useCases/CrearComentarioUseCase";
import type { EliminarComentarioUseCase } from "../../../application/useCases/EliminarComentarioUseCase";
import type { ObtenerComentariosUseCase } from "../../../application/useCases/ObtenerComentariosUseCase";
import {
	comentarioIdSchema,
	comentarioSchema,
	listarComentariosSchema,
	tareaComentariosSchema,
} from "../schemas/comentarioSchemas";

/** Comentarios de una tarea (`/api/tareas/:id/comentarios`). */
export class ComentarioTareaController extends BaseController {
	constructor(
		private readonly useCases: {
			obtenerTodos: ObtenerComentariosUseCase;
			crear: CrearComentarioUseCase;
			actualizar: ActualizarComentarioUseCase;
			eliminar: EliminarComentarioUseCase;
		},
	) {
		super();
	}

	obtenerTodos = (c: Context<AuthEnv>): Promise<Response> =>
		this.executeSafely(c, async () => {
			const { id } = validate(tareaComentariosSchema, c.req.param());
			const paginacion = validate(listarComentariosSchema, c.req.query());
			return this.ok(
				c,
				await this.useCases.obtenerTodos.ejecutar(
					c.get("usuario").id,
					id,
					paginacion,
				),
			);
		});

	crear = (c: Context<AuthEnv>): Promise<Response> =>
		this.executeSafely(c, async () => {
			const { id } = validate(tareaComentariosSchema, c.req.param());
			const { contenido } = validate(comentarioSchema, await c.req.json());
			return this.created(
				c,
				await this.useCases.crear.ejecutar(c.get("usuario").id, id, contenido),
			);
		});

	actualizar = (c: Context<AuthEnv>): Promise<Response> =>
		this.executeSafely(c, async () => {
			const { id, comentarioId } = validate(comentarioIdSchema, c.req.param());
			const { contenido } = validate(comentarioSchema, await c.req.json());
			return this.ok(
				c,
				await this.useCases.actualizar.ejecutar(
					c.get("usuario").id,
					{ tareaId: id, id: comentarioId },
					contenido,
				),
			);
		});

	eliminar = (c: Context<AuthEnv>): Promise<Response> =>
		this.executeSafely(c, async () => {
			const { id, comentarioId } = validate(comentarioIdSchema, c.req.param());
			await this.useCases.eliminar.ejecutar(c.get("usuario").id, {
				tareaId: id,
				id: comentarioId,
			});
			return c.body(null, 204);
		});
}
