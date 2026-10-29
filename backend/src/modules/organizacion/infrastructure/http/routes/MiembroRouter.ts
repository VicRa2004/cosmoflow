import { OpenAPIHono, z } from "@hono/zod-openapi";
import {
	errorResponse,
	jsonResponse,
	protectedErrorResponses,
} from "@/core/shared/infrastructure/http/openapi";
import type { PermisoGuard } from "@/core/shared/infrastructure/http/permisoGuard";
import type { AuthMiddleware } from "@/modules/auth";
import type { MiembroController } from "../controllers/MiembroController";
import {
	delegarSchema,
	miembroDtoSchema,
	miembroParamsSchema,
} from "../schemas/miembroSchemas";
import { organizacionIdSchema } from "../schemas/organizacionSchemas";

const tags = ["Miembros"];
const security = [{ bearerAuth: [] }];
const recurso = "organizaciones";

/** Se monta en `/api/organizaciones`: `/{id}/miembros` y `/{id}/delegar`. */
export class MiembroRouter {
	public readonly router = new OpenAPIHono();

	constructor(
		authMiddleware: AuthMiddleware,
		guard: PermisoGuard,
		controller: MiembroController,
	) {
		const docs = this.router.openAPIRegistry;
		this.router.use("/:id/miembros/*", authMiddleware.handle);
		this.router.use("/:id/delegar", authMiddleware.handle);

		docs.registerPath({
			method: "get",
			path: "/{id}/miembros",
			tags,
			security,
			summary: "Miembros de la organización (el admin primero)",
			request: { params: organizacionIdSchema },
			responses: {
				200: jsonResponse(z.array(miembroDtoSchema), "Miembros"),
				...protectedErrorResponses(`${recurso}:leer`),
				404: errorResponse("Organización no encontrada"),
			},
		});
		this.router.get(
			"/:id/miembros",
			guard.handle(recurso, "leer"),
			controller.obtenerTodos,
		);

		docs.registerPath({
			method: "delete",
			path: "/{id}/miembros/{usuarioId}",
			tags,
			security,
			summary:
				"Salir (con mi propio usuarioId) o expulsar a otro miembro (permiso miembros:expulsar)",
			request: { params: miembroParamsSchema },
			responses: {
				204: { description: "Ya no es miembro" },
				...protectedErrorResponses(`${recurso}:leer`),
				403: errorResponse(
					"Sin el permiso miembros:expulsar, o el objetivo es el admin",
				),
				404: errorResponse("Organización o miembro no encontrados"),
				409: errorResponse("El admin debe delegar antes de salir (RN-16)"),
			},
		});
		this.router.delete(
			"/:id/miembros/:usuarioId",
			guard.handle(recurso, "leer"),
			controller.quitar,
		);

		docs.registerPath({
			method: "post",
			path: "/{id}/delegar",
			tags,
			security,
			summary: "Ceder la administración a otro miembro (solo admin)",
			request: {
				params: organizacionIdSchema,
				body: {
					required: true,
					content: { "application/json": { schema: delegarSchema } },
				},
			},
			responses: {
				204: { description: "Administración delegada" },
				400: errorResponse("Validación fallida"),
				...protectedErrorResponses(`${recurso}:actualizar`),
				403: errorResponse("Solo el administrador puede hacerlo"),
				404: errorResponse("Organización o miembro no encontrados"),
			},
		});
		this.router.post(
			"/:id/delegar",
			guard.handle(recurso, "actualizar"),
			controller.delegar,
		);
	}
}
