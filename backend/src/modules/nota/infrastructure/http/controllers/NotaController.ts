import type { Context } from "hono";
import type { ActualizarNotaUseCase } from "../../../application/useCases/ActualizarNotaUseCase";
import type { CrearNotaUseCase } from "../../../application/useCases/CrearNotaUseCase";
import type { EliminarNotaUseCase } from "../../../application/useCases/EliminarNotaUseCase";
import type { ImportarNotasUseCase } from "../../../application/useCases/ImportarNotasUseCase";
import type { ObtenerNotaUseCase } from "../../../application/useCases/ObtenerNotaUseCase";
import type { ObtenerNotasUseCase } from "../../../application/useCases/ObtenerNotasUseCase";
import {
	actualizarNotaSchema,
	crearNotaSchema,
	importarNotasSchema,
	obtenerNotasSchema,
	notaIdSchema,
} from "../schemas/notaSchemas";
import { BaseController } from "@/core/shared/infrastructure/http/base.controller";
import { validate } from "@/core/shared/infrastructure/libs/validate";
import type { AuthEnv } from "@/modules/auth";

/** Cada handler opera sobre las notas del usuario autenticado. */
export class NotaController extends BaseController {
	// Objeto con nombres y no posicional: varios casos de uso tienen la misma forma (`ejecutar(id)`).
	constructor(
		private readonly useCases: {
			crear: CrearNotaUseCase;
			obtenerTodos: ObtenerNotasUseCase;
			obtenerUno: ObtenerNotaUseCase;
			actualizar: ActualizarNotaUseCase;
			eliminar: EliminarNotaUseCase;
			importar: ImportarNotasUseCase;
		},
	) {
		super();
	}

	crear = (c: Context<AuthEnv>): Promise<Response> =>
		this.executeSafely(c, async () => {
			const dto = validate(crearNotaSchema, await c.req.json());
			return this.created(
				c,
				await this.useCases.crear.ejecutar(c.get("usuario").id, dto),
			);
		});

	obtenerTodos = (c: Context<AuthEnv>): Promise<Response> =>
		this.executeSafely(c, async () => {
			const dto = validate(obtenerNotasSchema, c.req.query());
			return this.ok(
				c,
				await this.useCases.obtenerTodos.ejecutar(c.get("usuario").id, dto),
			);
		});

	obtenerUno = (c: Context<AuthEnv>): Promise<Response> =>
		this.executeSafely(c, async () => {
			const { id } = validate(notaIdSchema, c.req.param());
			return this.ok(
				c,
				await this.useCases.obtenerUno.ejecutar(c.get("usuario").id, id),
			);
		});

	actualizar = (c: Context<AuthEnv>): Promise<Response> =>
		this.executeSafely(c, async () => {
			const { id } = validate(notaIdSchema, c.req.param());
			const dto = validate(actualizarNotaSchema, await c.req.json());
			return this.ok(
				c,
				await this.useCases.actualizar.ejecutar(c.get("usuario").id, id, dto),
			);
		});

	eliminar = (c: Context<AuthEnv>): Promise<Response> =>
		this.executeSafely(c, async () => {
			const { id } = validate(notaIdSchema, c.req.param());
			await this.useCases.eliminar.ejecutar(c.get("usuario").id, id);
			return c.body(null, 204);
		});

	importar = (c: Context<AuthEnv>): Promise<Response> =>
		this.executeSafely(c, async () => {
			const dto = validate(importarNotasSchema, await c.req.json());
			return this.created(
				c,
				await this.useCases.importar.ejecutar(c.get("usuario").id, dto),
			);
		});
}
