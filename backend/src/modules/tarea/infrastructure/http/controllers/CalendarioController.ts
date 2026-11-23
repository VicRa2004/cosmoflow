import type { Context } from "hono";
import { env } from "@/core/config/env";
import { BaseController } from "@/core/shared/infrastructure/http/base.controller";
import { validate } from "@/core/shared/infrastructure/libs/validate";
import type { AuthEnv } from "@/modules/auth";
import type { GenerarSuscripcionCalendarioUseCase } from "../../../application/useCases/GenerarSuscripcionCalendarioUseCase";
import type { ObtenerFeedCalendarioUseCase } from "../../../application/useCases/ObtenerFeedCalendarioUseCase";
import type { ObtenerSuscripcionCalendarioUseCase } from "../../../application/useCases/ObtenerSuscripcionCalendarioUseCase";
import type { RevocarSuscripcionCalendarioUseCase } from "../../../application/useCases/RevocarSuscripcionCalendarioUseCase";
import { generarIcs } from "../../ics/generarIcs";
import { feedCalendarioSchema } from "../schemas/calendarioSchemas";

/** Feed iCalendar de las tareas (#173) y su URL secreta. */
export class CalendarioController extends BaseController {
	constructor(
		private readonly useCases: {
			feed: ObtenerFeedCalendarioUseCase;
			obtener: ObtenerSuscripcionCalendarioUseCase;
			generar: GenerarSuscripcionCalendarioUseCase;
			revocar: RevocarSuscripcionCalendarioUseCase;
		},
	) {
		super();
	}

	feed = (c: Context): Promise<Response> =>
		this.executeSafely(c, async () => {
			const { token } = validate(feedCalendarioSchema, c.req.query());
			const tareas = await this.useCases.feed.ejecutar(token);
			return c.body(generarIcs(tareas, env.APP_URL), 200, {
				"Content-Type": "text/calendar; charset=utf-8",
				"Cache-Control": "private, max-age=300",
			});
		});

	obtener = (c: Context<AuthEnv>): Promise<Response> =>
		this.executeSafely(c, async () =>
			this.ok(c, await this.useCases.obtener.ejecutar(c.get("usuario").id)),
		);

	generar = (c: Context<AuthEnv>): Promise<Response> =>
		this.executeSafely(c, async () =>
			this.created(
				c,
				await this.useCases.generar.ejecutar(c.get("usuario").id),
			),
		);

	revocar = (c: Context<AuthEnv>): Promise<Response> =>
		this.executeSafely(c, async () => {
			await this.useCases.revocar.ejecutar(c.get("usuario").id);
			return c.body(null, 204);
		});
}
