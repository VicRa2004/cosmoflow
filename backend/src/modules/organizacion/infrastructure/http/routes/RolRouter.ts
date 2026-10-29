import { OpenAPIHono, z } from "@hono/zod-openapi";
import {
	errorResponse,
	jsonResponse,
	protectedErrorResponses,
} from "@/core/shared/infrastructure/http/openapi";
import type { PermisoGuard } from "@/core/shared/infrastructure/http/permisoGuard";
import type { AuthMiddleware } from "@/modules/auth";
import type { RolController } from "../controllers/RolController";
import { miembroParamsSchema } from "../schemas/miembroSchemas";
import { organizacionIdSchema } from "../schemas/organizacionSchemas";
import {
	asignarRolesSchema,
	catalogoSchema,
	guardarRolSchema,
	rolDtoSchema,
	rolParamsSchema,
} from "../schemas/rolSchemas";

const tags = ["Roles de organización"];
const security = [{ bearerAuth: [] }];
const recurso = "organizaciones";
const gestionar = {
	...protectedErrorResponses(`${recurso}:actualizar`),
	403: errorResponse("Sin el permiso roles:gestionar"),
};
const bodyRol = {
	required: true,
	content: { "application/json": { schema: guardarRolSchema } },
};

/** Se monta en `/api/organizaciones`: `/{id}/roles...` y `/{id}/miembros/{usuarioId}/roles`. */
export class RolRouter {
	public readonly router = new OpenAPIHono();

	constructor(
		authMiddleware: AuthMiddleware,
		guard: PermisoGuard,
		controller: RolController,
	) {
		const docs = this.router.openAPIRegistry;
		this.router.use("/:id/roles/*", authMiddleware.handle);
		this.router.use("/:id/miembros/:usuarioId/roles", authMiddleware.handle);

		// Antes de `/{id}/roles/{rolId}`: «catalogo» no es un ID.
		docs.registerPath({
			method: "get",
			path: "/{id}/roles/catalogo",
			tags,
			security,
			summary: "Catálogo fijo de permisos y plantillas de rol (RN-17)",
			request: { params: organizacionIdSchema },
			responses: {
				200: jsonResponse(catalogoSchema, "Catálogo"),
				...protectedErrorResponses(`${recurso}:leer`),
			},
		});
		this.router.get(
			"/:id/roles/catalogo",
			guard.handle(recurso, "leer"),
			controller.catalogo,
		);

		docs.registerPath({
			method: "get",
			path: "/{id}/roles",
			tags,
			security,
			summary: "Roles de la organización (cualquier miembro)",
			request: { params: organizacionIdSchema },
			responses: {
				200: jsonResponse(z.array(rolDtoSchema), "Roles"),
				...protectedErrorResponses(`${recurso}:leer`),
				404: errorResponse("Organización no encontrada"),
			},
		});
		this.router.get(
			"/:id/roles",
			guard.handle(recurso, "leer"),
			controller.obtenerTodos,
		);

		docs.registerPath({
			method: "post",
			path: "/{id}/roles",
			tags,
			security,
			summary: "Crear rol (desde cero o copiando una plantilla)",
			request: { params: organizacionIdSchema, body: bodyRol },
			responses: {
				201: jsonResponse(rolDtoSchema, "Rol creado"),
				400: errorResponse("Validación fallida o permiso fuera del catálogo"),
				...gestionar,
				404: errorResponse("Organización no encontrada"),
				409: errorResponse("Ya hay un rol con ese nombre"),
			},
		});
		this.router.post(
			"/:id/roles",
			guard.handle(recurso, "actualizar"),
			controller.crear,
		);

		docs.registerPath({
			method: "put",
			path: "/{id}/roles/{rolId}",
			tags,
			security,
			summary: "Editar nombre y permisos de un rol",
			request: { params: rolParamsSchema, body: bodyRol },
			responses: {
				200: jsonResponse(rolDtoSchema, "Rol guardado"),
				400: errorResponse("Validación fallida o permiso fuera del catálogo"),
				...gestionar,
				404: errorResponse("Organización o rol no encontrados"),
				409: errorResponse("Ya hay un rol con ese nombre"),
			},
		});
		this.router.put(
			"/:id/roles/:rolId",
			guard.handle(recurso, "actualizar"),
			controller.actualizar,
		);

		docs.registerPath({
			method: "delete",
			path: "/{id}/roles/{rolId}",
			tags,
			security,
			summary: "Eliminar un rol (se les quita a quienes lo tengan)",
			request: { params: rolParamsSchema },
			responses: {
				204: { description: "Rol eliminado" },
				...gestionar,
				404: errorResponse("Organización o rol no encontrados"),
			},
		});
		this.router.delete(
			"/:id/roles/:rolId",
			guard.handle(recurso, "actualizar"),
			controller.eliminar,
		);

		docs.registerPath({
			method: "put",
			path: "/{id}/miembros/{usuarioId}/roles",
			tags,
			security,
			summary: "Reemplazar los roles de un miembro (RN-14)",
			request: {
				params: miembroParamsSchema,
				body: {
					required: true,
					content: { "application/json": { schema: asignarRolesSchema } },
				},
			},
			responses: {
				204: { description: "Roles asignados" },
				400: errorResponse("Validación fallida"),
				...gestionar,
				404: errorResponse("Organización, miembro o rol no encontrados"),
			},
		});
		this.router.put(
			"/:id/miembros/:usuarioId/roles",
			guard.handle(recurso, "actualizar"),
			controller.asignar,
		);
	}
}
