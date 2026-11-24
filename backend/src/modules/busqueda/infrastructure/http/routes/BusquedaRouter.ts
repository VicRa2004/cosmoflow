import { OpenAPIHono } from "@hono/zod-openapi";
import {
	errorResponse,
	jsonResponse,
	protectedErrorResponses,
} from "@/core/shared/infrastructure/http/openapi";
import type { PermisoGuard } from "@/core/shared/infrastructure/http/permisoGuard";
import type { AuthMiddleware } from "@/modules/auth";
import type { BusquedaController } from "../controllers/BusquedaController";
import {
	buscarSchema,
	resultadosBusquedaSchema,
} from "../schemas/busquedaSchemas";

const permisos = "tareas:leer, notas:leer y organizaciones:leer";

export class BusquedaRouter {
	public readonly router = new OpenAPIHono();

	constructor(
		authMiddleware: AuthMiddleware,
		guard: PermisoGuard,
		controller: BusquedaController,
	) {
		this.router.use(authMiddleware.handle);

		this.router.openAPIRegistry.registerPath({
			method: "get",
			path: "/",
			tags: ["Búsqueda"],
			security: [{ bearerAuth: [] }],
			summary:
				"Búsqueda global en tareas, notas, proyectos y equipos visibles (#52)",
			request: { query: buscarSchema },
			responses: {
				200: jsonResponse(resultadosBusquedaSchema, "Hasta 5 de cada tipo"),
				400: errorResponse(
					"Texto vacío, de menos de 2 o más de 100 caracteres",
				),
				...protectedErrorResponses(permisos),
			},
		});
		// Los mismos permisos que piden los listados de los que salen los resultados.
		this.router.get(
			"/",
			guard.handle("tareas", "leer"),
			guard.handle("notas", "leer"),
			guard.handle("organizaciones", "leer"),
			controller.ejecutar,
		);
	}
}
