import type { Context } from "hono";
import type { ActualizarCarpetaUseCase } from "../../../application/useCases/ActualizarCarpetaUseCase";
import type { CrearCarpetaUseCase } from "../../../application/useCases/CrearCarpetaUseCase";
import type { EliminarCarpetaUseCase } from "../../../application/useCases/EliminarCarpetaUseCase";
import type { ObtenerCarpetasUseCase } from "../../../application/useCases/ObtenerCarpetasUseCase";
import {
	actualizarCarpetaSchema,
	carpetaIdSchema,
	crearCarpetaSchema,
	obtenerCarpetasSchema,
} from "../schemas/carpetaSchemas";
import { BaseController } from "@/core/shared/infrastructure/http/base.controller";
import { validate } from "@/core/shared/infrastructure/libs/validate";
import type { AuthEnv } from "@/modules/auth";

/** Carpetas de notas del usuario autenticado o de sus proyectos. */
export class CarpetaController extends BaseController {
	constructor(
		private readonly useCases: {
			crear: CrearCarpetaUseCase;
			obtenerTodos: ObtenerCarpetasUseCase;
			actualizar: ActualizarCarpetaUseCase;
			eliminar: EliminarCarpetaUseCase;
		},
	) {
		super();
	}

	crear = (c: Context<AuthEnv>): Promise<Response> =>
		this.executeSafely(c, async () => {
			const dto = validate(crearCarpetaSchema, await c.req.json());
			return this.created(
				c,
				await this.useCases.crear.ejecutar(c.get("usuario").id, dto),
			);
		});

	obtenerTodos = (c: Context<AuthEnv>): Promise<Response> =>
		this.executeSafely(c, async () => {
			const { proyectoId } = validate(obtenerCarpetasSchema, c.req.query());
			return this.ok(
				c,
				await this.useCases.obtenerTodos.ejecutar(
					c.get("usuario").id,
					proyectoId,
				),
			);
		});

	actualizar = (c: Context<AuthEnv>): Promise<Response> =>
		this.executeSafely(c, async () => {
			const { id } = validate(carpetaIdSchema, c.req.param());
			const dto = validate(actualizarCarpetaSchema, await c.req.json());
			return this.ok(
				c,
				await this.useCases.actualizar.ejecutar(c.get("usuario").id, id, dto),
			);
		});

	eliminar = (c: Context<AuthEnv>): Promise<Response> =>
		this.executeSafely(c, async () => {
			const { id } = validate(carpetaIdSchema, c.req.param());
			await this.useCases.eliminar.ejecutar(c.get("usuario").id, id);
			return c.body(null, 204);
		});
}
