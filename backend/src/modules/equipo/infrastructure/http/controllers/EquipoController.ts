import type { Context } from "hono";
import { BaseController } from "@/core/shared/infrastructure/http/base.controller";
import { validate } from "@/core/shared/infrastructure/libs/validate";
import type { AuthEnv } from "@/modules/auth";
import type { AmbitoEquipo } from "../../../application/dtos/EquipoDto";
import type { ActualizarEquipoUseCase } from "../../../application/useCases/ActualizarEquipoUseCase";
import type { CambiarDelegadosUseCase } from "../../../application/useCases/CambiarDelegadosUseCase";
import type { CrearEquipoUseCase } from "../../../application/useCases/CrearEquipoUseCase";
import type { EliminarEquipoUseCase } from "../../../application/useCases/EliminarEquipoUseCase";
import type { ObtenerEquipoUseCase } from "../../../application/useCases/ObtenerEquipoUseCase";
import type { ObtenerEquiposUseCase } from "../../../application/useCases/ObtenerEquiposUseCase";
import {
	actualizarEquipoSchema,
	crearEquipoSchema,
	delegadosSchema,
	equipoParamsSchema,
	obtenerEquiposSchema,
	organizacionIdParamSchema,
} from "../schemas/equipoSchemas";

export class EquipoController extends BaseController {
	constructor(
		private readonly useCases: {
			obtenerTodos: ObtenerEquiposUseCase;
			obtenerUno: ObtenerEquipoUseCase;
			crear: CrearEquipoUseCase;
			actualizar: ActualizarEquipoUseCase;
			delegados: CambiarDelegadosUseCase;
			eliminar: EliminarEquipoUseCase;
		},
	) {
		super();
	}

	private ambito(c: Context<AuthEnv>): AmbitoEquipo {
		const { organizacionId } = validate(
			organizacionIdParamSchema,
			c.req.param(),
		);
		return { usuarioId: c.get("usuario").id, organizacionId };
	}

	private id(c: Context<AuthEnv>): number {
		return validate(equipoParamsSchema, c.req.param()).id;
	}

	obtenerTodos = (c: Context<AuthEnv>): Promise<Response> =>
		this.executeSafely(c, async () => {
			const filtro = validate(obtenerEquiposSchema, c.req.query());
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
			const dto = validate(crearEquipoSchema, await c.req.json());
			return this.created(
				c,
				await this.useCases.crear.ejecutar(this.ambito(c), dto),
			);
		});

	actualizar = (c: Context<AuthEnv>): Promise<Response> =>
		this.executeSafely(c, async () => {
			const dto = validate(actualizarEquipoSchema, await c.req.json());
			return this.ok(
				c,
				await this.useCases.actualizar.ejecutar(
					this.ambito(c),
					this.id(c),
					dto,
				),
			);
		});

	delegados = (c: Context<AuthEnv>): Promise<Response> =>
		this.executeSafely(c, async () => {
			const { usuarioIds } = validate(delegadosSchema, await c.req.json());
			return this.ok(
				c,
				await this.useCases.delegados.ejecutar(
					this.ambito(c),
					this.id(c),
					usuarioIds,
				),
			);
		});

	eliminar = (c: Context<AuthEnv>): Promise<Response> =>
		this.executeSafely(c, async () => {
			await this.useCases.eliminar.ejecutar(this.ambito(c), this.id(c));
			return c.body(null, 204);
		});
}
