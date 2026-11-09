import type { Context } from "hono";
import { BaseController } from "@/core/shared/infrastructure/http/base.controller";
import { validate } from "@/core/shared/infrastructure/libs/validate";
import type { AuthEnv } from "@/modules/auth";
import type { CambiarAvatarEquipoUseCase } from "../../../application/useCases/CambiarAvatarEquipoUseCase";
import type { ObtenerAvatarEquipoUseCase } from "../../../application/useCases/ObtenerAvatarEquipoUseCase";
import { EquipoInvalidoError } from "../../../domain/error/EquipoInvalidoError";
import { equipoParamsSchema } from "../schemas/equipoSchemas";

export class AvatarEquipoController extends BaseController {
	constructor(
		private readonly useCases: {
			cambiar: CambiarAvatarEquipoUseCase;
			obtener: ObtenerAvatarEquipoUseCase;
		},
	) {
		super();
	}

	private params(c: Context<AuthEnv>) {
		const { organizacionId, id } = validate(equipoParamsSchema, c.req.param());
		return { ambito: { usuarioId: c.get("usuario").id, organizacionId }, id };
	}

	obtener = (c: Context<AuthEnv>): Promise<Response> =>
		this.executeSafely(c, async () => {
			const { ambito, id } = this.params(c);
			const { datos, tipo } = await this.useCases.obtener.ejecutar(ambito, id);
			// Privada (solo miembros); la URL lleva la clave (`?v=`), así que no caduca.
			c.header("Cache-Control", "private, max-age=31536000, immutable");
			c.header("Content-Type", tipo);
			c.header("X-Content-Type-Options", "nosniff");
			return c.body(datos);
		});

	subir = (c: Context<AuthEnv>): Promise<Response> =>
		this.executeSafely(c, async () => {
			const { ambito, id } = this.params(c);
			const { archivo } = await c.req.parseBody();
			if (!(archivo instanceof File)) {
				throw new EquipoInvalidoError("Falta el archivo en el campo «archivo»");
			}
			const datos = new Uint8Array(await archivo.arrayBuffer());
			return this.ok(
				c,
				await this.useCases.cambiar.ejecutar(ambito, id, datos),
			);
		});

	eliminar = (c: Context<AuthEnv>): Promise<Response> =>
		this.executeSafely(c, async () => {
			const { ambito, id } = this.params(c);
			return this.ok(c, await this.useCases.cambiar.ejecutar(ambito, id, null));
		});
}
