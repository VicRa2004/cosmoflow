import type { Context } from "hono";
import type { ActualizarTagUseCase } from "../../../application/useCases/ActualizarTagUseCase";
import type { CrearTagUseCase } from "../../../application/useCases/CrearTagUseCase";
import type { EliminarTagUseCase } from "../../../application/useCases/EliminarTagUseCase";
import type { ObtenerTagUseCase } from "../../../application/useCases/ObtenerTagUseCase";
import type { ObtenerTagsUseCase } from "../../../application/useCases/ObtenerTagsUseCase";
import {
	actualizarTagSchema,
	crearTagSchema,
	obtenerTagsSchema,
	tagIdSchema,
} from "../schemas/tagSchemas";
import { BaseController } from "@/core/shared/infrastructure/http/base.controller";
import { validate } from "@/core/shared/infrastructure/libs/validate";
import type { AuthEnv } from "@/modules/auth";

/** Cada handler opera sobre los tags del usuario autenticado. */
export class TagController extends BaseController {
	// Objeto con nombres y no posicional: varios casos de uso tienen la misma forma (`ejecutar(id)`).
	constructor(
		private readonly useCases: {
			crear: CrearTagUseCase;
			obtenerTodos: ObtenerTagsUseCase;
			obtenerUno: ObtenerTagUseCase;
			actualizar: ActualizarTagUseCase;
			eliminar: EliminarTagUseCase;
		},
	) {
		super();
	}

	crear = (c: Context<AuthEnv>): Promise<Response> =>
		this.executeSafely(c, async () => {
			const dto = validate(crearTagSchema, await c.req.json());
			return this.created(
				c,
				await this.useCases.crear.ejecutar(c.get("usuario").id, dto),
			);
		});

	obtenerTodos = (c: Context<AuthEnv>): Promise<Response> =>
		this.executeSafely(c, async () => {
			const dto = validate(obtenerTagsSchema, c.req.query());
			return this.ok(
				c,
				await this.useCases.obtenerTodos.ejecutar(c.get("usuario").id, dto),
			);
		});

	obtenerUno = (c: Context<AuthEnv>): Promise<Response> =>
		this.executeSafely(c, async () => {
			const { id } = validate(tagIdSchema, c.req.param());
			return this.ok(
				c,
				await this.useCases.obtenerUno.ejecutar(c.get("usuario").id, id),
			);
		});

	actualizar = (c: Context<AuthEnv>): Promise<Response> =>
		this.executeSafely(c, async () => {
			const { id } = validate(tagIdSchema, c.req.param());
			const dto = validate(actualizarTagSchema, await c.req.json());
			return this.ok(
				c,
				await this.useCases.actualizar.ejecutar(c.get("usuario").id, id, dto),
			);
		});

	eliminar = (c: Context<AuthEnv>): Promise<Response> =>
		this.executeSafely(c, async () => {
			const { id } = validate(tagIdSchema, c.req.param());
			await this.useCases.eliminar.ejecutar(c.get("usuario").id, id);
			return c.body(null, 204);
		});
}
