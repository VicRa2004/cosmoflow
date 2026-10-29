import type { Context } from "hono";
import { BaseController } from "@/core/shared/infrastructure/http/base.controller";
import { validate } from "@/core/shared/infrastructure/libs/validate";
import type { AuthEnv } from "@/modules/auth";
import type { ObtenerAdjuntoUseCase } from "../../../application/useCases/ObtenerAdjuntoUseCase";
import type { SubirAdjuntoUseCase } from "../../../application/useCases/SubirAdjuntoUseCase";
import { AdjuntoInvalidoError } from "../../../domain/error/AdjuntoInvalidoError";
import { adjuntoIdSchema } from "../schemas/adjuntoSchemas";

export class AdjuntoController extends BaseController {
	constructor(
		private readonly useCases: {
			subir: SubirAdjuntoUseCase;
			obtener: ObtenerAdjuntoUseCase;
		},
	) {
		super();
	}

	subir = (c: Context<AuthEnv>): Promise<Response> =>
		this.executeSafely(c, async () => {
			const { archivo } = await c.req.parseBody();
			if (!(archivo instanceof File)) {
				throw new AdjuntoInvalidoError(
					"Falta el archivo en el campo «archivo»",
				);
			}
			const datos = new Uint8Array(await archivo.arrayBuffer());
			return this.created(
				c,
				await this.useCases.subir.ejecutar(c.get("usuario").id, datos),
			);
		});

	obtener = (c: Context<AuthEnv>): Promise<Response> =>
		this.executeSafely(c, async () => {
			const { id } = validate(adjuntoIdSchema, c.req.param());
			const { datos, tipo } = await this.useCases.obtener.ejecutar(
				c.get("usuario").id,
				id,
			);
			// Un adjunto no cambia nunca; `private` para que no lo guarden cachés compartidas.
			c.header("Cache-Control", "private, max-age=31536000, immutable");
			c.header("Content-Type", tipo);
			c.header("X-Content-Type-Options", "nosniff");
			return c.body(datos);
		});
}
