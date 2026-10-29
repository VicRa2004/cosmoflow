import type { Context } from "hono";
import { BaseController } from "@/core/shared/infrastructure/http/base.controller";
import { validate } from "@/core/shared/infrastructure/libs/validate";
import type { AuthEnv } from "@/modules/auth";
import type { DelegarAdministracionUseCase } from "../../../application/useCases/DelegarAdministracionUseCase";
import type { ObtenerMiembrosUseCase } from "../../../application/useCases/ObtenerMiembrosUseCase";
import type { QuitarMiembroUseCase } from "../../../application/useCases/QuitarMiembroUseCase";
import { delegarSchema, miembroParamsSchema } from "../schemas/miembroSchemas";
import { organizacionIdSchema } from "../schemas/organizacionSchemas";

export class MiembroController extends BaseController {
	constructor(
		private readonly useCases: {
			obtenerTodos: ObtenerMiembrosUseCase;
			quitar: QuitarMiembroUseCase;
			delegar: DelegarAdministracionUseCase;
		},
	) {
		super();
	}

	obtenerTodos = (c: Context<AuthEnv>): Promise<Response> =>
		this.executeSafely(c, async () => {
			const { id } = validate(organizacionIdSchema, c.req.param());
			return this.ok(
				c,
				await this.useCases.obtenerTodos.ejecutar(c.get("usuario").id, id),
			);
		});

	quitar = (c: Context<AuthEnv>): Promise<Response> =>
		this.executeSafely(c, async () => {
			const { id, usuarioId } = validate(miembroParamsSchema, c.req.param());
			await this.useCases.quitar.ejecutar(c.get("usuario").id, id, usuarioId);
			return c.body(null, 204);
		});

	delegar = (c: Context<AuthEnv>): Promise<Response> =>
		this.executeSafely(c, async () => {
			const { id } = validate(organizacionIdSchema, c.req.param());
			const { usuarioId } = validate(delegarSchema, await c.req.json());
			await this.useCases.delegar.ejecutar(c.get("usuario").id, id, usuarioId);
			return c.body(null, 204);
		});
}
