import type { Context } from "hono";
import { BaseController } from "@/core/shared/infrastructure/http/base.controller";
import { validate } from "@/core/shared/infrastructure/libs/validate";
import type { AuthEnv } from "@/modules/auth";
import type { CambiarAvatarOrganizacionUseCase } from "../../../application/useCases/CambiarAvatarOrganizacionUseCase";
import type { ObtenerAvatarOrganizacionUseCase } from "../../../application/useCases/ObtenerAvatarOrganizacionUseCase";
import { AvatarOrganizacionInvalidoError } from "../../../domain/error/AvatarOrganizacionInvalidoError";
import { organizacionIdSchema } from "../schemas/organizacionSchemas";

export class AvatarOrganizacionController extends BaseController {
	constructor(
		private readonly useCases: {
			cambiar: CambiarAvatarOrganizacionUseCase;
			obtener: ObtenerAvatarOrganizacionUseCase;
		},
	) {
		super();
	}

	obtener = (c: Context<AuthEnv>): Promise<Response> =>
		this.executeSafely(c, async () => {
			const { id } = validate(organizacionIdSchema, c.req.param());
			const { datos, tipo } = await this.useCases.obtener.ejecutar(
				c.get("usuario").id,
				id,
			);
			// Privada (solo miembros); la URL lleva la clave (`?v=`), así que no caduca.
			c.header("Cache-Control", "private, max-age=31536000, immutable");
			c.header("Content-Type", tipo);
			c.header("X-Content-Type-Options", "nosniff");
			return c.body(datos);
		});

	subir = (c: Context<AuthEnv>): Promise<Response> =>
		this.executeSafely(c, async () => {
			const { id } = validate(organizacionIdSchema, c.req.param());
			const { archivo } = await c.req.parseBody();
			if (!(archivo instanceof File)) {
				throw new AvatarOrganizacionInvalidoError(
					"Falta el archivo en el campo «archivo»",
				);
			}
			const datos = new Uint8Array(await archivo.arrayBuffer());
			return this.ok(
				c,
				await this.useCases.cambiar.ejecutar(c.get("usuario").id, id, datos),
			);
		});

	eliminar = (c: Context<AuthEnv>): Promise<Response> =>
		this.executeSafely(c, async () => {
			const { id } = validate(organizacionIdSchema, c.req.param());
			return this.ok(
				c,
				await this.useCases.cambiar.ejecutar(c.get("usuario").id, id, null),
			);
		});
}
