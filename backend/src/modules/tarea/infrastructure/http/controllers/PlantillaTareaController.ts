import type { Context } from "hono";
import { BaseController } from "@/core/shared/infrastructure/http/base.controller";
import { validate } from "@/core/shared/infrastructure/libs/validate";
import type { AuthEnv } from "@/modules/auth";
import type { ActualizarPlantillaUseCase } from "../../../application/useCases/plantillas/ActualizarPlantillaUseCase";
import type { CrearPlantillaUseCase } from "../../../application/useCases/plantillas/CrearPlantillaUseCase";
import type { EliminarPlantillaUseCase } from "../../../application/useCases/plantillas/EliminarPlantillaUseCase";
import type { ObtenerPlantillasUseCase } from "../../../application/useCases/plantillas/ObtenerPlantillasUseCase";
import type { AmbitoPlantilla } from "../../../application/useCases/plantillas/resolverDuenoPlantilla";
import {
	actualizarPlantillaSchema,
	ambitoPlantillaSchema,
	crearPlantillaSchema,
	plantillaIdSchema,
} from "../schemas/plantillaSchemas";

/** Plantillas del usuario o, si la ruta trae `organizacionId`, de esa organización (#175). */
export class PlantillaTareaController extends BaseController {
	constructor(
		private readonly useCases: {
			obtenerTodos: ObtenerPlantillasUseCase;
			crear: CrearPlantillaUseCase;
			actualizar: ActualizarPlantillaUseCase;
			eliminar: EliminarPlantillaUseCase;
		},
	) {
		super();
	}

	private ambito(c: Context<AuthEnv>): AmbitoPlantilla {
		const { organizacionId } = validate(ambitoPlantillaSchema, c.req.param());
		return { usuarioId: c.get("usuario").id, organizacionId };
	}

	obtenerTodos = (c: Context<AuthEnv>): Promise<Response> =>
		this.executeSafely(c, async () =>
			this.ok(c, await this.useCases.obtenerTodos.ejecutar(this.ambito(c))),
		);

	crear = (c: Context<AuthEnv>): Promise<Response> =>
		this.executeSafely(c, async () => {
			const datos = validate(crearPlantillaSchema, await c.req.json());
			return this.created(
				c,
				await this.useCases.crear.ejecutar(this.ambito(c), datos),
			);
		});

	actualizar = (c: Context<AuthEnv>): Promise<Response> =>
		this.executeSafely(c, async () => {
			const { id } = validate(plantillaIdSchema, c.req.param());
			const cambios = validate(actualizarPlantillaSchema, await c.req.json());
			return this.ok(
				c,
				await this.useCases.actualizar.ejecutar(this.ambito(c), id, cambios),
			);
		});

	eliminar = (c: Context<AuthEnv>): Promise<Response> =>
		this.executeSafely(c, async () => {
			const { id } = validate(plantillaIdSchema, c.req.param());
			await this.useCases.eliminar.ejecutar(this.ambito(c), id);
			return c.body(null, 204);
		});
}
