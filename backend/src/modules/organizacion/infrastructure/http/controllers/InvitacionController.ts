import type { Context } from "hono";
import { BaseController } from "@/core/shared/infrastructure/http/base.controller";
import { validate } from "@/core/shared/infrastructure/libs/validate";
import type { AuthEnv } from "@/modules/auth";
import type { CancelarInvitacionUseCase } from "../../../application/useCases/CancelarInvitacionUseCase";
import type { InvitarUseCase } from "../../../application/useCases/InvitarUseCase";
import type { ObtenerInvitacionesUseCase } from "../../../application/useCases/ObtenerInvitacionesUseCase";
import type { ReenviarInvitacionUseCase } from "../../../application/useCases/ReenviarInvitacionUseCase";
import {
	invitacionParamsSchema,
	invitarSchema,
} from "../schemas/invitacionSchemas";
import { organizacionIdSchema } from "../schemas/organizacionSchemas";

/** Lado del administrador: invitaciones de su organización. */
export class InvitacionController extends BaseController {
	constructor(
		private readonly useCases: {
			invitar: InvitarUseCase;
			obtenerTodas: ObtenerInvitacionesUseCase;
			reenviar: ReenviarInvitacionUseCase;
			cancelar: CancelarInvitacionUseCase;
		},
	) {
		super();
	}

	invitar = (c: Context<AuthEnv>): Promise<Response> =>
		this.executeSafely(c, async () => {
			const { id } = validate(organizacionIdSchema, c.req.param());
			const { email } = validate(invitarSchema, await c.req.json());
			return this.created(
				c,
				await this.useCases.invitar.ejecutar(c.get("usuario").id, id, email),
			);
		});

	obtenerTodas = (c: Context<AuthEnv>): Promise<Response> =>
		this.executeSafely(c, async () => {
			const { id } = validate(organizacionIdSchema, c.req.param());
			return this.ok(
				c,
				await this.useCases.obtenerTodas.ejecutar(c.get("usuario").id, id),
			);
		});

	reenviar = (c: Context<AuthEnv>): Promise<Response> =>
		this.executeSafely(c, async () => {
			const { id, invitacionId } = validate(
				invitacionParamsSchema,
				c.req.param(),
			);
			return this.ok(
				c,
				await this.useCases.reenviar.ejecutar(
					c.get("usuario").id,
					id,
					invitacionId,
				),
			);
		});

	cancelar = (c: Context<AuthEnv>): Promise<Response> =>
		this.executeSafely(c, async () => {
			const { id, invitacionId } = validate(
				invitacionParamsSchema,
				c.req.param(),
			);
			await this.useCases.cancelar.ejecutar(
				c.get("usuario").id,
				id,
				invitacionId,
			);
			return c.body(null, 204);
		});
}
