import { OpenAPIHono, z } from "@hono/zod-openapi";
import {
	errorResponse,
	jsonResponse,
	protectedErrorResponses,
} from "@/core/shared/infrastructure/http/openapi";
import type { PermisoGuard } from "@/core/shared/infrastructure/http/permisoGuard";
import type { AuthMiddleware } from "@/modules/auth";
import type { PlantillaTareaController } from "../controllers/PlantillaTareaController";
import {
	actualizarPlantillaSchema,
	crearPlantillaSchema,
	organizacionIdParamSchema,
	plantillaDtoSchema,
	plantillaIdSchema,
} from "../schemas/plantillaSchemas";

const security = [{ bearerAuth: [] }];
// Plantillas = tareas por hacer: mismos permisos globales que las tareas.
const recurso = "tareas";

export class PlantillaTareaRouter {
	public readonly router = new OpenAPIHono();

	constructor(
		authMiddleware: AuthMiddleware,
		guard: PermisoGuard,
		controller: PlantillaTareaController,
		/** Montado en `/api/organizaciones/{organizacionId}/plantillas`. */
		enOrganizacion = false,
	) {
		const docs = this.router.openAPIRegistry;
		const tags = [
			enOrganizacion ? "Plantillas de organización" : "Plantillas de tareas",
		];
		const paramsRaiz = enOrganizacion ? organizacionIdParamSchema : undefined;
		const paramsId = enOrganizacion
			? plantillaIdSchema.extend(organizacionIdParamSchema.shape)
			: plantillaIdSchema;
		const gestionar = enOrganizacion
			? { 403: errorResponse("Sin plantillas:gestionar en la organización") }
			: {};
		this.router.use(authMiddleware.handle);

		docs.registerPath({
			method: "get",
			path: "/",
			tags,
			security,
			summary: "Listar plantillas (por nombre, máx. 200)",
			request: { params: paramsRaiz },
			responses: {
				200: jsonResponse(z.array(plantillaDtoSchema), "Plantillas"),
				...protectedErrorResponses(`${recurso}:leer`),
			},
		});
		this.router.get(
			"/",
			guard.handle(recurso, "leer"),
			controller.obtenerTodos,
		);

		docs.registerPath({
			method: "post",
			path: "/",
			tags,
			security,
			summary: "Crear plantilla",
			request: {
				params: paramsRaiz,
				body: {
					required: true,
					content: { "application/json": { schema: crearPlantillaSchema } },
				},
			},
			responses: {
				201: jsonResponse(plantillaDtoSchema, "Plantilla creada"),
				400: errorResponse("Validación fallida"),
				...protectedErrorResponses(`${recurso}:crear`),
				...gestionar,
			},
		});
		this.router.post("/", guard.handle(recurso, "crear"), controller.crear);

		docs.registerPath({
			method: "put",
			path: "/{id}",
			tags,
			security,
			summary: "Actualizar plantilla",
			request: {
				params: paramsId,
				body: {
					required: true,
					content: {
						"application/json": { schema: actualizarPlantillaSchema },
					},
				},
			},
			responses: {
				200: jsonResponse(plantillaDtoSchema, "Plantilla actualizada"),
				400: errorResponse("Validación fallida"),
				...protectedErrorResponses(`${recurso}:crear`),
				...gestionar,
				404: errorResponse("Plantilla no encontrada"),
			},
		});
		this.router.put(
			"/:id",
			guard.handle(recurso, "crear"),
			controller.actualizar,
		);

		docs.registerPath({
			method: "delete",
			path: "/{id}",
			tags,
			security,
			summary: "Eliminar plantilla (definitivo)",
			request: { params: paramsId },
			responses: {
				204: { description: "Plantilla eliminada" },
				...protectedErrorResponses(`${recurso}:crear`),
				...gestionar,
				404: errorResponse("Plantilla no encontrada"),
			},
		});
		this.router.delete(
			"/:id",
			guard.handle(recurso, "crear"),
			controller.eliminar,
		);
	}
}
