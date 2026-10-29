import type { Context } from "hono";
import type { ActualizarOrganizacionUseCase } from "../../../application/useCases/ActualizarOrganizacionUseCase";
import type { CrearOrganizacionUseCase } from "../../../application/useCases/CrearOrganizacionUseCase";
import type { EliminarOrganizacionUseCase } from "../../../application/useCases/EliminarOrganizacionUseCase";
import type { ObtenerOrganizacionUseCase } from "../../../application/useCases/ObtenerOrganizacionUseCase";
import type { ObtenerOrganizacionesUseCase } from "../../../application/useCases/ObtenerOrganizacionesUseCase";
import {
	actualizarOrganizacionSchema,
	crearOrganizacionSchema,
	obtenerOrganizacionesSchema,
	organizacionIdSchema,
} from "../schemas/organizacionSchemas";
import { BaseController } from "@/core/shared/infrastructure/http/base.controller";
import { validate } from "@/core/shared/infrastructure/libs/validate";
import type { AuthEnv } from "@/modules/auth";

/** Cada handler opera como el usuario autenticado: solo ve las organizaciones de las que es miembro. */
export class OrganizacionController extends BaseController {
	// Objeto con nombres y no posicional: varios casos de uso tienen la misma forma (`ejecutar(id)`).
	constructor(
		private readonly useCases: {
			crear: CrearOrganizacionUseCase;
			obtenerTodos: ObtenerOrganizacionesUseCase;
			obtenerUno: ObtenerOrganizacionUseCase;
			actualizar: ActualizarOrganizacionUseCase;
			eliminar: EliminarOrganizacionUseCase;
		},
	) {
		super();
	}

	crear = (c: Context<AuthEnv>): Promise<Response> =>
		this.executeSafely(c, async () => {
			const dto = validate(crearOrganizacionSchema, await c.req.json());
			return this.created(
				c,
				await this.useCases.crear.ejecutar(c.get("usuario").id, dto),
			);
		});

	obtenerTodos = (c: Context<AuthEnv>): Promise<Response> =>
		this.executeSafely(c, async () => {
			const dto = validate(obtenerOrganizacionesSchema, c.req.query());
			return this.ok(
				c,
				await this.useCases.obtenerTodos.ejecutar(c.get("usuario").id, dto),
			);
		});

	obtenerUno = (c: Context<AuthEnv>): Promise<Response> =>
		this.executeSafely(c, async () => {
			const { id } = validate(organizacionIdSchema, c.req.param());
			return this.ok(
				c,
				await this.useCases.obtenerUno.ejecutar(c.get("usuario").id, id),
			);
		});

	actualizar = (c: Context<AuthEnv>): Promise<Response> =>
		this.executeSafely(c, async () => {
			const { id } = validate(organizacionIdSchema, c.req.param());
			const dto = validate(actualizarOrganizacionSchema, await c.req.json());
			return this.ok(
				c,
				await this.useCases.actualizar.ejecutar(c.get("usuario").id, id, dto),
			);
		});

	eliminar = (c: Context<AuthEnv>): Promise<Response> =>
		this.executeSafely(c, async () => {
			const { id } = validate(organizacionIdSchema, c.req.param());
			await this.useCases.eliminar.ejecutar(c.get("usuario").id, id);
			return c.body(null, 204);
		});
}
