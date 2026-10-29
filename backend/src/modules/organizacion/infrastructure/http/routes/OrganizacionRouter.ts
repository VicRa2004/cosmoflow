import { OpenAPIHono, z } from "@hono/zod-openapi";
import { bodyLimit } from "hono/body-limit";
import {
	errorResponse,
	jsonResponse,
	protectedErrorResponses,
} from "@/core/shared/infrastructure/http/openapi";
import type { AuthMiddleware } from "@/modules/auth";
import type { PermisoGuard } from "@/core/shared/infrastructure/http/permisoGuard";
import { AVATAR_ORGANIZACION_MAX_BYTES } from "../../../application/useCases/CambiarAvatarOrganizacionUseCase";
import type { AvatarOrganizacionController } from "../controllers/AvatarOrganizacionController";
import type { OrganizacionController } from "../controllers/OrganizacionController";
import {
	actualizarOrganizacionSchema,
	crearOrganizacionSchema,
	obtenerOrganizacionesSchema,
	organizacionDtoSchema,
	organizacionIdSchema,
	organizacionPaginaSchema,
} from "../schemas/organizacionSchemas";

const tags = ["Organizaciones"];
const security = [{ bearerAuth: [] }];
const recurso = "organizaciones";

export class OrganizacionRouter {
	public readonly router = new OpenAPIHono();

	constructor(
		authMiddleware: AuthMiddleware,
		guard: PermisoGuard,
		controller: OrganizacionController,
		avatar: AvatarOrganizacionController,
	) {
		const docs = this.router.openAPIRegistry;
		this.router.use(authMiddleware.handle);

		docs.registerPath({
			method: "post",
			path: "/",
			tags,
			security,
			summary: "Crear organización (quien la crea queda como administrador)",
			request: {
				body: {
					required: true,
					content: { "application/json": { schema: crearOrganizacionSchema } },
				},
			},
			responses: {
				201: jsonResponse(organizacionDtoSchema, "Organización creada"),
				400: errorResponse("Validación fallida"),
				...protectedErrorResponses(`${recurso}:crear`),
			},
		});
		this.router.post("/", guard.handle(recurso, "crear"), controller.crear);

		docs.registerPath({
			method: "get",
			path: "/",
			tags,
			security,
			summary: "Listar mis organizaciones (paginado)",
			request: { query: obtenerOrganizacionesSchema },
			responses: {
				200: jsonResponse(organizacionPaginaSchema, "Lista paginada"),
				400: errorResponse("Parámetros inválidos"),
				...protectedErrorResponses(`${recurso}:leer`),
			},
		});
		this.router.get(
			"/",
			guard.handle(recurso, "leer"),
			controller.obtenerTodos,
		);

		docs.registerPath({
			method: "get",
			path: "/{id}",
			tags,
			security,
			summary: "Obtener una organización de la que soy miembro",
			request: { params: organizacionIdSchema },
			responses: {
				200: jsonResponse(organizacionDtoSchema, "Organización encontrada"),
				...protectedErrorResponses(`${recurso}:leer`),
				404: errorResponse("Organización no encontrada"),
			},
		});
		this.router.get(
			"/:id",
			guard.handle(recurso, "leer"),
			controller.obtenerUno,
		);

		docs.registerPath({
			method: "put",
			path: "/{id}",
			tags,
			security,
			summary: "Personalizar la organización (solo administrador)",
			request: {
				params: organizacionIdSchema,
				body: {
					required: true,
					content: {
						"application/json": { schema: actualizarOrganizacionSchema },
					},
				},
			},
			responses: {
				200: jsonResponse(organizacionDtoSchema, "Organización actualizada"),
				400: errorResponse("Validación fallida"),
				...protectedErrorResponses(`${recurso}:actualizar`),
				403: errorResponse("Solo el administrador puede hacerlo"),
				404: errorResponse("Organización no encontrada"),
			},
		});
		this.router.put(
			"/:id",
			guard.handle(recurso, "actualizar"),
			controller.actualizar,
		);

		docs.registerPath({
			method: "delete",
			path: "/{id}",
			tags,
			security,
			summary: "Eliminar la organización (solo administrador, borrado lógico)",
			request: { params: organizacionIdSchema },
			responses: {
				204: { description: "Organización eliminada" },
				...protectedErrorResponses(`${recurso}:eliminar`),
				403: errorResponse("Solo el administrador puede hacerlo"),
				404: errorResponse("Organización no encontrada"),
			},
		});
		this.router.delete(
			"/:id",
			guard.handle(recurso, "eliminar"),
			controller.eliminar,
		);

		docs.registerPath({
			method: "get",
			path: "/{id}/avatar",
			tags,
			security,
			summary: "Avatar de la organización (solo miembros)",
			request: { params: organizacionIdSchema },
			responses: {
				200: {
					description: "Imagen PNG, JPEG o WebP",
					content: {
						"image/*": { schema: z.string().openapi({ format: "binary" }) },
					},
				},
				...protectedErrorResponses(`${recurso}:leer`),
				404: errorResponse("Organización o avatar no encontrados"),
			},
		});
		this.router.get(
			"/:id/avatar",
			guard.handle(recurso, "leer"),
			avatar.obtener,
		);

		docs.registerPath({
			method: "put",
			path: "/{id}/avatar",
			tags,
			security,
			summary:
				"Subir el avatar (multipart, campo «archivo», máx. 2 MB; solo administrador)",
			request: {
				params: organizacionIdSchema,
				body: {
					required: true,
					content: {
						"multipart/form-data": {
							schema: z.object({
								archivo: z.string().openapi({ format: "binary" }),
							}),
						},
					},
				},
			},
			responses: {
				200: jsonResponse(
					organizacionDtoSchema,
					"Organización con el avatar nuevo",
				),
				400: errorResponse("Archivo ausente o no es PNG, JPEG ni WebP"),
				...protectedErrorResponses(`${recurso}:actualizar`),
				403: errorResponse("Solo el administrador puede hacerlo"),
				404: errorResponse("Organización no encontrada"),
				413: errorResponse("El archivo supera los 2 MB"),
			},
		});
		this.router.put(
			"/:id/avatar",
			guard.handle(recurso, "actualizar"),
			// Margen para las cabeceras del multipart; el tamaño exacto lo valida el caso de uso.
			bodyLimit({
				maxSize: AVATAR_ORGANIZACION_MAX_BYTES + 64 * 1024,
				onError: (c) => c.json({ error: "El archivo supera los 2 MB" }, 413),
			}),
			avatar.subir,
		);

		docs.registerPath({
			method: "delete",
			path: "/{id}/avatar",
			tags,
			security,
			summary: "Quitar el avatar (solo administrador)",
			request: { params: organizacionIdSchema },
			responses: {
				200: jsonResponse(organizacionDtoSchema, "Organización sin avatar"),
				...protectedErrorResponses(`${recurso}:actualizar`),
				403: errorResponse("Solo el administrador puede hacerlo"),
				404: errorResponse("Organización no encontrada"),
			},
		});
		this.router.delete(
			"/:id/avatar",
			guard.handle(recurso, "actualizar"),
			avatar.eliminar,
		);
	}
}
