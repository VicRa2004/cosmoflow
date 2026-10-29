import type { Context } from "hono";
import { BaseController } from "@/core/shared/infrastructure/http/base.controller";
import { validate } from "@/core/shared/infrastructure/libs/validate";
import type { AuthEnv } from "@/modules/auth";
import type { ConsultarInvitacionUseCase } from "../../../application/useCases/ConsultarInvitacionUseCase";
import type { ResponderInvitacionUseCase } from "../../../application/useCases/ResponderInvitacionUseCase";
import { tokenInvitacionSchema } from "../schemas/invitacionSchemas";

/** Lado de quien recibe la invitación; el token va en el cuerpo, no en la URL (logs). */
export class RespuestaInvitacionController extends BaseController {
	constructor(
		private readonly useCases: {
			consultar: ConsultarInvitacionUseCase;
			responder: ResponderInvitacionUseCase;
		},
	) {
		super();
	}

	consultar = (c: Context<AuthEnv>): Promise<Response> =>
		this.executeSafely(c, async () => {
			const { token } = validate(tokenInvitacionSchema, await c.req.json());
			return this.ok(
				c,
				await this.useCases.consultar.ejecutar(c.get("usuario").email, token),
			);
		});

	aceptar = (c: Context<AuthEnv>): Promise<Response> => this.responder(c, true);

	rechazar = (c: Context<AuthEnv>): Promise<Response> =>
		this.responder(c, false);

	private responder = (c: Context<AuthEnv>, aceptar: boolean) =>
		this.executeSafely(c, async () => {
			const { token } = validate(tokenInvitacionSchema, await c.req.json());
			return this.ok(
				c,
				await this.useCases.responder.ejecutar(
					c.get("usuario"),
					token,
					aceptar,
				),
			);
		});
}
