import type { Context } from "hono";
import { BaseController } from "@/core/shared/infrastructure/http/base.controller";
import { validate } from "@/core/shared/infrastructure/libs/validate";
import type { AuthEnv } from "@/modules/auth";
import type { AmbitoProyecto } from "../../../application/dtos/ProyectoDto";
import type { ActualizarProyectoUseCase } from "../../../application/useCases/ActualizarProyectoUseCase";
import type { CrearProyectoUseCase } from "../../../application/useCases/CrearProyectoUseCase";
import type { EliminarProyectoUseCase } from "../../../application/useCases/EliminarProyectoUseCase";
import type { ObtenerProyectoUseCase } from "../../../application/useCases/ObtenerProyectoUseCase";
import type { ObtenerProyectosUseCase } from "../../../application/useCases/ObtenerProyectosUseCase";
import {
	actualizarProyectoSchema,
	crearProyectoSchema,
	obtenerProyectosSchema,
	organizacionIdParamSchema,
	proyectoParamsSchema,
} from "../schemas/proyectoSchemas";

export class ProyectoController extends BaseController {
	constructor(
		private readonly useCases: {
			obtenerTodos: ObtenerProyectosUseCase;
			obtenerUno: ObtenerProyectoUseCase;
			crear: CrearProyectoUseCase;
			actualizar: ActualizarProyectoUseCase;
			eliminar: EliminarProyectoUseCase;
		},
	) {
		super();
	}

	private ambito(c: Context<AuthEnv>): AmbitoProyecto {
		const { organizacionId } = validate(
			organizacionIdParamSchema,
			c.req.param(),
		);
		return { usuarioId: c.get("usuario").id, organizacionId };
	}

	private id(c: Context<AuthEnv>): number {
		return validate(proyectoParamsSchema, c.req.param()).id;
	}

	obtenerTodos = (c: Context<AuthEnv>): Promise<Response> =>
		this.executeSafely(c, async () => {
			const filtro = validate(obtenerProyectosSchema, c.req.query());
			return this.ok(
				c,
				await this.useCases.obtenerTodos.ejecutar(this.ambito(c), filtro),
			);
		});

	obtenerUno = (c: Context<AuthEnv>): Promise<Response> =>
		this.executeSafely(c, async () =>
			this.ok(
				c,
				await this.useCases.obtenerUno.ejecutar(this.ambito(c), this.id(c)),
			),
		);

	crear = (c: Context<AuthEnv>): Promise<Response> =>
		this.executeSafely(c, async () => {
			const dto = validate(crearProyectoSchema, await c.req.json());
			return this.created(
				c,
				await this.useCases.crear.ejecutar(this.ambito(c), dto),
			);
		});

	actualizar = (c: Context<AuthEnv>): Promise<Response> =>
		this.executeSafely(c, async () => {
			const dto = validate(actualizarProyectoSchema, await c.req.json());
			return this.ok(
				c,
				await this.useCases.actualizar.ejecutar(
					this.ambito(c),
					this.id(c),
					dto,
				),
			);
		});

	eliminar = (c: Context<AuthEnv>): Promise<Response> =>
		this.executeSafely(c, async () => {
			await this.useCases.eliminar.ejecutar(this.ambito(c), this.id(c));
			return c.body(null, 204);
		});
}
