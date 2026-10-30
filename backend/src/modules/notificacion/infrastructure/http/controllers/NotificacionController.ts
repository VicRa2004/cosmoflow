import type { Context } from "hono";
import { BaseController } from "@/core/shared/infrastructure/http/base.controller";
import { validate } from "@/core/shared/infrastructure/libs/validate";
import type { AuthEnv } from "@/modules/auth";
import type { ActualizarPreferenciasUseCase } from "../../../application/useCases/ActualizarPreferenciasUseCase";
import type { ObtenerPreferenciasUseCase } from "../../../application/useCases/ObtenerPreferenciasUseCase";
import type { ActualizarPreferenciasOrganizacionUseCase } from "../../../application/useCases/ActualizarPreferenciasOrganizacionUseCase";
import type { ObtenerPreferenciasOrganizacionUseCase } from "../../../application/useCases/ObtenerPreferenciasOrganizacionUseCase";
import {
	organizacionIdParamSchema,
	preferenciasSchema,
} from "../schemas/notificacionSchemas";

/** Preferencias del usuario autenticado (solo las suyas) y las de una organización. */
export class NotificacionController extends BaseController {
	constructor(
		private readonly useCases: {
			obtenerPreferencias: ObtenerPreferenciasUseCase;
			actualizarPreferencias: ActualizarPreferenciasUseCase;
			obtenerDeOrganizacion: ObtenerPreferenciasOrganizacionUseCase;
			actualizarDeOrganizacion: ActualizarPreferenciasOrganizacionUseCase;
		},
	) {
		super();
	}

	obtenerPreferencias = (c: Context<AuthEnv>): Promise<Response> =>
		this.executeSafely(c, async () =>
			this.ok(
				c,
				await this.useCases.obtenerPreferencias.ejecutar(c.get("usuario").id),
			),
		);

	actualizarPreferencias = (c: Context<AuthEnv>): Promise<Response> =>
		this.executeSafely(c, async () => {
			const preferencias = validate(preferenciasSchema, await c.req.json());
			return this.ok(
				c,
				await this.useCases.actualizarPreferencias.ejecutar(
					c.get("usuario").id,
					preferencias,
				),
			);
		});

	private organizacionId(c: Context<AuthEnv>): number {
		return validate(organizacionIdParamSchema, c.req.param()).organizacionId;
	}

	obtenerDeOrganizacion = (c: Context<AuthEnv>): Promise<Response> =>
		this.executeSafely(c, async () =>
			this.ok(
				c,
				await this.useCases.obtenerDeOrganizacion.ejecutar(
					c.get("usuario").id,
					this.organizacionId(c),
				),
			),
		);

	actualizarDeOrganizacion = (c: Context<AuthEnv>): Promise<Response> =>
		this.executeSafely(c, async () => {
			const preferencias = validate(preferenciasSchema, await c.req.json());
			return this.ok(
				c,
				await this.useCases.actualizarDeOrganizacion.ejecutar(
					c.get("usuario").id,
					this.organizacionId(c),
					preferencias,
				),
			);
		});
}
