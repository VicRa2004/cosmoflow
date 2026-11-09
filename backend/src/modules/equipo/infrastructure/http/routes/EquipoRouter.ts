import { OpenAPIHono, z } from "@hono/zod-openapi";
import { bodyLimit } from "hono/body-limit";
import {
	errorResponse,
	jsonResponse,
	protectedErrorResponses,
} from "@/core/shared/infrastructure/http/openapi";
import type { PermisoGuard } from "@/core/shared/infrastructure/http/permisoGuard";
import type { AuthMiddleware } from "@/modules/auth";
import { AVATAR_EQUIPO_MAX_BYTES } from "../../../application/useCases/CambiarAvatarEquipoUseCase";
import type { AvatarEquipoController } from "../controllers/AvatarEquipoController";
import type { EquipoController } from "../controllers/EquipoController";
import {
	actualizarEquipoSchema,
	crearEquipoSchema,
	delegadosSchema,
	equipoDtoSchema,
	equipoParamsSchema,
	obtenerEquiposSchema,
	organizacionIdParamSchema,
} from "../schemas/equipoSchemas";

const tags = ["Equipos"];
const security = [{ bearerAuth: [] }];
const recurso = "organizaciones";
const json = <T extends z.ZodType>(schema: T) => ({
	required: true,
	content: { "application/json": { schema } },
});
const escribir = (permiso: string) => ({
	...protectedErrorResponses(`${recurso}:actualizar`),
	403: errorResponse(`Sin el permiso ${permiso}`),
	404: errorResponse("Organización o equipo no encontrado"),
});

/** Se monta en `/api/organizaciones/{organizacionId}/equipos` (RN-20 a 26). */
export class EquipoRouter {
	public readonly router = new OpenAPIHono();

	constructor(
		authMiddleware: AuthMiddleware,
		guard: PermisoGuard,
		controller: EquipoController,
		avatar: AvatarEquipoController,
	) {
		const docs = this.router.openAPIRegistry;
		const leer = guard.handle(recurso, "leer");
		const actualizar = guard.handle(recurso, "actualizar");
		this.router.use(authMiddleware.handle);

		docs.registerPath({
			method: "get",
			path: "/",
			tags,
			security,
			summary: "Equipos de la organización (cualquier miembro)",
			request: {
				params: organizacionIdParamSchema,
				query: obtenerEquiposSchema,
			},
			responses: {
				200: jsonResponse(z.array(equipoDtoSchema), "Equipos"),
				...protectedErrorResponses(`${recurso}:leer`),
				404: errorResponse("Organización no encontrada"),
			},
		});
		this.router.get("/", leer, controller.obtenerTodos);

		docs.registerPath({
			method: "post",
			path: "/",
			tags,
			security,
			summary: "Crear equipo (equipos:crear)",
			request: {
				params: organizacionIdParamSchema,
				body: json(crearEquipoSchema),
			},
			responses: {
				201: jsonResponse(equipoDtoSchema, "Equipo creado"),
				400: errorResponse("Validación fallida o menos de 2 miembros"),
				...escribir("equipos:crear"),
			},
		});
		this.router.post("/", actualizar, controller.crear);

		docs.registerPath({
			method: "get",
			path: "/{id}",
			tags,
			security,
			summary: "Obtener equipo",
			request: { params: equipoParamsSchema },
			responses: {
				200: jsonResponse(equipoDtoSchema, "Equipo"),
				...protectedErrorResponses(`${recurso}:leer`),
				404: errorResponse("Organización o equipo no encontrado"),
			},
		});
		this.router.get("/:id", leer, controller.obtenerUno);

		docs.registerPath({
			method: "put",
			path: "/{id}",
			tags,
			security,
			summary: "Editar datos, miembros, líder y tags (equipos:editar)",
			request: {
				params: equipoParamsSchema,
				body: json(actualizarEquipoSchema),
			},
			responses: {
				200: jsonResponse(equipoDtoSchema, "Equipo actualizado"),
				400: errorResponse("Validación fallida o menos de 2 miembros"),
				...escribir("equipos:editar"),
			},
		});
		this.router.put("/:id", actualizar, controller.actualizar);

		docs.registerPath({
			method: "put",
			path: "/{id}/delegados",
			tags,
			security,
			summary:
				"Elegir quién crea y asigna tareas (líder o equipos:editar, RN-22)",
			request: { params: equipoParamsSchema, body: json(delegadosSchema) },
			responses: {
				200: jsonResponse(equipoDtoSchema, "Delegados guardados"),
				400: errorResponse("Algún delegado no es miembro del equipo"),
				...escribir("equipos:editar ni ser el líder"),
			},
		});
		this.router.put("/:id/delegados", actualizar, controller.delegados);

		docs.registerPath({
			method: "delete",
			path: "/{id}",
			tags,
			security,
			summary: "Eliminar equipo (equipos:eliminar)",
			request: { params: equipoParamsSchema },
			responses: {
				204: { description: "Equipo eliminado" },
				...escribir("equipos:eliminar"),
				409: errorResponse("Es el único integrante de algún proyecto (RN-31)"),
			},
		});
		this.router.delete("/:id", actualizar, controller.eliminar);

		docs.registerPath({
			method: "get",
			path: "/{id}/avatar",
			tags,
			security,
			summary: "Foto del equipo (cualquier miembro de la organización)",
			request: { params: equipoParamsSchema },
			responses: {
				200: {
					description: "Imagen PNG, JPEG o WebP",
					content: {
						"image/*": { schema: z.string().openapi({ format: "binary" }) },
					},
				},
				...protectedErrorResponses(`${recurso}:leer`),
				404: errorResponse("Equipo o foto no encontrados"),
			},
		});
		this.router.get("/:id/avatar", leer, avatar.obtener);

		docs.registerPath({
			method: "put",
			path: "/{id}/avatar",
			tags,
			security,
			summary:
				"Subir la foto (multipart, campo «archivo», máx. 2 MB; equipos:editar)",
			request: {
				params: equipoParamsSchema,
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
				200: jsonResponse(equipoDtoSchema, "Equipo con la foto nueva"),
				400: errorResponse("Archivo ausente o no es PNG, JPEG ni WebP"),
				...escribir("equipos:editar"),
				413: errorResponse("El archivo supera los 2 MB"),
			},
		});
		this.router.put(
			"/:id/avatar",
			actualizar,
			// Margen para las cabeceras del multipart; el tamaño exacto lo valida el caso de uso.
			bodyLimit({
				maxSize: AVATAR_EQUIPO_MAX_BYTES + 64 * 1024,
				onError: (c) => c.json({ error: "El archivo supera los 2 MB" }, 413),
			}),
			avatar.subir,
		);

		docs.registerPath({
			method: "delete",
			path: "/{id}/avatar",
			tags,
			security,
			summary: "Quitar la foto (equipos:editar)",
			request: { params: equipoParamsSchema },
			responses: {
				200: jsonResponse(equipoDtoSchema, "Equipo sin foto"),
				...escribir("equipos:editar"),
			},
		});
		this.router.delete("/:id/avatar", actualizar, avatar.eliminar);
	}
}
