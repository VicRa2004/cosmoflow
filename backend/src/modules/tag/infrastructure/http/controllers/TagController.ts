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
	ambitoTagSchema,
	tagIdSchema,
} from "../schemas/tagSchemas";
import { BaseController } from "@/core/shared/infrastructure/http/base.controller";
import { validate } from "@/core/shared/infrastructure/libs/validate";
import type { AuthEnv } from "@/modules/auth";
import type { AmbitoTag } from "../../../application/resolverDueno";

/** Tags del usuario autenticado o, si la ruta trae `organizacionId`, de esa organización. */
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

	private ambito(c: Context<AuthEnv>): AmbitoTag {
		const { organizacionId } = validate(ambitoTagSchema, c.req.param());
		return { usuarioId: c.get("usuario").id, organizacionId };
	}

	crear = (c: Context<AuthEnv>): Promise<Response> =>
		this.executeSafely(c, async () => {
			const dto = validate(crearTagSchema, await c.req.json());
			return this.created(
				c,
				await this.useCases.crear.ejecutar(this.ambito(c), dto),
			);
		});

	obtenerTodos = (c: Context<AuthEnv>): Promise<Response> =>
		this.executeSafely(c, async () => {
			const dto = validate(obtenerTagsSchema, c.req.query());
			return this.ok(
				c,
				await this.useCases.obtenerTodos.ejecutar(this.ambito(c), dto),
			);
		});

	obtenerUno = (c: Context<AuthEnv>): Promise<Response> =>
		this.executeSafely(c, async () => {
			const { id } = validate(tagIdSchema, c.req.param());
			return this.ok(
				c,
				await this.useCases.obtenerUno.ejecutar(this.ambito(c), id),
			);
		});

	actualizar = (c: Context<AuthEnv>): Promise<Response> =>
		this.executeSafely(c, async () => {
			const { id } = validate(tagIdSchema, c.req.param());
			const dto = validate(actualizarTagSchema, await c.req.json());
			return this.ok(
				c,
				await this.useCases.actualizar.ejecutar(this.ambito(c), id, dto),
			);
		});

	eliminar = (c: Context<AuthEnv>): Promise<Response> =>
		this.executeSafely(c, async () => {
			const { id } = validate(tagIdSchema, c.req.param());
			await this.useCases.eliminar.ejecutar(this.ambito(c), id);
			return c.body(null, 204);
		});
}
