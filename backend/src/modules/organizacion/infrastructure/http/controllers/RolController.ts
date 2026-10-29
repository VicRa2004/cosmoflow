import type { Context } from "hono";
import { BaseController } from "@/core/shared/infrastructure/http/base.controller";
import { validate } from "@/core/shared/infrastructure/libs/validate";
import type { AuthEnv } from "@/modules/auth";
import type { ActualizarRolUseCase } from "../../../application/useCases/ActualizarRolUseCase";
import type { AsignarRolesUseCase } from "../../../application/useCases/AsignarRolesUseCase";
import type { CrearRolUseCase } from "../../../application/useCases/CrearRolUseCase";
import type { EliminarRolUseCase } from "../../../application/useCases/EliminarRolUseCase";
import type { ObtenerRolesUseCase } from "../../../application/useCases/ObtenerRolesUseCase";
import {
	PERMISOS_ORGANIZACION,
	PLANTILLAS_ROL,
} from "../../../domain/permisosOrganizacion";
import { miembroParamsSchema } from "../schemas/miembroSchemas";
import { organizacionIdSchema } from "../schemas/organizacionSchemas";
import {
	asignarRolesSchema,
	guardarRolSchema,
	rolParamsSchema,
} from "../schemas/rolSchemas";

export class RolController extends BaseController {
	constructor(
		private readonly useCases: {
			obtenerTodos: ObtenerRolesUseCase;
			crear: CrearRolUseCase;
			actualizar: ActualizarRolUseCase;
			eliminar: EliminarRolUseCase;
			asignar: AsignarRolesUseCase;
		},
	) {
		super();
	}

	/** Constante de la app (RN-17): igual para todas las organizaciones. */
	catalogo = (c: Context<AuthEnv>): Promise<Response> =>
		this.executeSafely(c, async () =>
			this.ok(c, {
				permisos: PERMISOS_ORGANIZACION,
				plantillas: PLANTILLAS_ROL,
			}),
		);

	obtenerTodos = (c: Context<AuthEnv>): Promise<Response> =>
		this.executeSafely(c, async () => {
			const { id } = validate(organizacionIdSchema, c.req.param());
			return this.ok(
				c,
				await this.useCases.obtenerTodos.ejecutar(c.get("usuario").id, id),
			);
		});

	crear = (c: Context<AuthEnv>): Promise<Response> =>
		this.executeSafely(c, async () => {
			const { id } = validate(organizacionIdSchema, c.req.param());
			const dto = validate(guardarRolSchema, await c.req.json());
			return this.created(
				c,
				await this.useCases.crear.ejecutar(c.get("usuario").id, id, dto),
			);
		});

	actualizar = (c: Context<AuthEnv>): Promise<Response> =>
		this.executeSafely(c, async () => {
			const { id, rolId } = validate(rolParamsSchema, c.req.param());
			const dto = validate(guardarRolSchema, await c.req.json());
			return this.ok(
				c,
				await this.useCases.actualizar.ejecutar(
					c.get("usuario").id,
					id,
					rolId,
					dto,
				),
			);
		});

	eliminar = (c: Context<AuthEnv>): Promise<Response> =>
		this.executeSafely(c, async () => {
			const { id, rolId } = validate(rolParamsSchema, c.req.param());
			await this.useCases.eliminar.ejecutar(c.get("usuario").id, id, rolId);
			return c.body(null, 204);
		});

	asignar = (c: Context<AuthEnv>): Promise<Response> =>
		this.executeSafely(c, async () => {
			const { id, usuarioId } = validate(miembroParamsSchema, c.req.param());
			const { rolIds } = validate(asignarRolesSchema, await c.req.json());
			await this.useCases.asignar.ejecutar(
				c.get("usuario").id,
				id,
				usuarioId,
				rolIds,
			);
			return c.body(null, 204);
		});
}
