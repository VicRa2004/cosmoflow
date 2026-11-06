import { OpenAPIHono } from "@hono/zod-openapi";
import {
	errorResponse,
	jsonResponse,
} from "@/core/shared/infrastructure/http/openapi";
import type { AuthMiddleware } from "@/modules/auth";
import type { PreferenciaController } from "../controllers/PreferenciaController";
import {
	actualizarPreferenciasInterfazSchema,
	preferenciasInterfazSchema,
} from "../schemas/preferenciaSchemas";

const tags = ["Preferencias"];
const security = [{ bearerAuth: [] }];

/** Se monta en `/api/preferencias`. Sin permiso propio: son del usuario autenticado. */
export class PreferenciaRouter {
	public readonly router = new OpenAPIHono();

	constructor(
		authMiddleware: AuthMiddleware,
		controller: PreferenciaController,
	) {
		const docs = this.router.openAPIRegistry;
		this.router.use(authMiddleware.handle);

		docs.registerPath({
			method: "get",
			path: "/",
			tags,
			security,
			summary: "Obtener mis preferencias de interfaz",
			responses: {
				200: jsonResponse(
					preferenciasInterfazSchema,
					"Todas, con las predeterminadas",
				),
				401: errorResponse("No autenticado"),
			},
		});
		this.router.get("/", controller.obtener);

		docs.registerPath({
			method: "put",
			path: "/",
			tags,
			security,
			summary:
				"Cambiar mis preferencias de interfaz; las no enviadas no cambian",
			request: {
				body: {
					required: true,
					content: {
						"application/json": {
							schema: actualizarPreferenciasInterfazSchema,
						},
					},
				},
			},
			responses: {
				200: jsonResponse(preferenciasInterfazSchema, "Todas, ya guardadas"),
				400: errorResponse("Opción o valor desconocido"),
				401: errorResponse("No autenticado"),
			},
		});
		this.router.put("/", controller.actualizar);
	}
}
