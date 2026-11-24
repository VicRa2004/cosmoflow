import { OpenAPIHono } from "@hono/zod-openapi";
import {
	errorResponse,
	jsonResponse,
} from "@/core/shared/infrastructure/http/openapi";
import { rateLimit } from "@/core/shared/infrastructure/http/rateLimit";
import type { DatosCuentaController } from "../controllers/DatosCuentaController";
import type { AuthMiddleware } from "../middlewares/authMiddleware";
import {
	datosExportadosSchema,
	eliminarCuentaSchema,
} from "../schemas/cuentaSchemas";

const tags = ["Cuenta"];
const security = [{ bearerAuth: [] }];
const errores = {
	401: errorResponse("No autenticado"),
	403: errorResponse("Solo con sesión, no con un token personal"),
};

/** Se monta en `/api/cuenta`. Solo con sesión: un token personal no exporta ni borra la cuenta. */
export class DatosCuentaRouter {
	public readonly router = new OpenAPIHono();

	constructor(
		authMiddleware: AuthMiddleware,
		controller: DatosCuentaController,
	) {
		const docs = this.router.openAPIRegistry;
		this.router.use(authMiddleware.handle, authMiddleware.soloSesion);

		docs.registerPath({
			method: "get",
			path: "/exportacion",
			tags,
			security,
			summary: "Exportar mis datos",
			description:
				"Tareas y notas (no borradas) que creó el usuario, personales y compartidas, con sus carpetas. El cliente las empaqueta en un ZIP.",
			responses: {
				200: jsonResponse(datosExportadosSchema, "Mis datos"),
				...errores,
			},
		});
		this.router.get(
			"/exportacion",
			rateLimit({ windowMs: 60 * 60 * 1000, limit: 10 }),
			controller.exportar,
		);

		docs.registerPath({
			method: "delete",
			path: "/",
			tags,
			security,
			summary: "Eliminar mi cuenta",
			description:
				"Pide la contraseña. Borra lo personal (tareas, notas, carpetas, tags, plantillas, adjuntos, sesiones y tokens), saca al usuario de sus organizaciones y anonimiza la cuenta; lo compartido que creó se queda en su organización como «Usuario eliminado». No se puede siendo el único administrador de una organización.",
			request: {
				body: {
					required: true,
					content: { "application/json": { schema: eliminarCuentaSchema } },
				},
			},
			responses: {
				204: { description: "Cuenta eliminada" },
				400: errorResponse("Validación fallida o contraseña incorrecta"),
				...errores,
				409: errorResponse("Único administrador de alguna organización"),
			},
		});
		this.router.delete(
			"/",
			rateLimit({ windowMs: 15 * 60 * 1000, limit: 5 }),
			controller.eliminar,
		);
	}
}
