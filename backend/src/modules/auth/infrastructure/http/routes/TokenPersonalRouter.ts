import { OpenAPIHono, z } from "@hono/zod-openapi";
import {
	errorResponse,
	jsonResponse,
} from "@/core/shared/infrastructure/http/openapi";
import type { TokenPersonalController } from "../controllers/TokenPersonalController";
import type { AuthMiddleware } from "../middlewares/authMiddleware";
import {
	crearTokenPersonalSchema,
	tokenPersonalCreadoSchema,
	tokenPersonalDtoSchema,
	tokenPersonalIdSchema,
} from "../schemas/tokenPersonalSchemas";

const tags = ["Tokens personales"];
const security = [{ bearerAuth: [] }];
const errores = {
	401: errorResponse("No autenticado"),
	403: errorResponse("Solo con sesión, no con un token personal"),
};

/** Se monta en `/api/tokens-personales`. Sin permiso propio: son del usuario autenticado. */
export class TokenPersonalRouter {
	public readonly router = new OpenAPIHono();

	constructor(
		authMiddleware: AuthMiddleware,
		controller: TokenPersonalController,
	) {
		const docs = this.router.openAPIRegistry;
		this.router.use(authMiddleware.handle, authMiddleware.soloSesion);

		docs.registerPath({
			method: "post",
			path: "/",
			tags,
			security,
			summary: "Crear un token personal; su valor solo se muestra aquí",
			request: {
				body: {
					required: true,
					content: { "application/json": { schema: crearTokenPersonalSchema } },
				},
			},
			responses: {
				201: jsonResponse(tokenPersonalCreadoSchema, "Token creado"),
				400: errorResponse("Validación fallida"),
				...errores,
			},
		});
		this.router.post("/", controller.crear);

		docs.registerPath({
			method: "get",
			path: "/",
			tags,
			security,
			summary: "Listar mis tokens personales sin revocar",
			responses: {
				200: jsonResponse(z.array(tokenPersonalDtoSchema), "Tokens"),
				...errores,
			},
		});
		this.router.get("/", controller.obtenerTodos);

		docs.registerPath({
			method: "delete",
			path: "/{id}",
			tags,
			security,
			summary: "Revocar un token personal",
			request: { params: tokenPersonalIdSchema },
			responses: {
				204: { description: "Token revocado" },
				...errores,
				404: errorResponse("Token no encontrado"),
			},
		});
		this.router.delete("/:id", controller.revocar);
	}
}
