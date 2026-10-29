import { OpenAPIHono, z } from "@hono/zod-openapi";
import {
	errorResponse,
	jsonResponse,
	protectedErrorResponses,
} from "@/core/shared/infrastructure/http/openapi";
import type { PermisoGuard } from "@/core/shared/infrastructure/http/permisoGuard";
import type { AuthMiddleware } from "@/modules/auth";
import type { ProyectoController } from "../controllers/ProyectoController";
import {
	actualizarProyectoSchema,
	crearProyectoSchema,
	obtenerProyectosSchema,
	organizacionIdParamSchema,
	proyectoDtoSchema,
	proyectoParamsSchema,
} from "../schemas/proyectoSchemas";

const tags = ["Proyectos"];
const security = [{ bearerAuth: [] }];
const recurso = "organizaciones";
const json = <T extends z.ZodType>(schema: T) => ({
	required: true,
	content: { "application/json": { schema } },
});
const escribir = (permiso: string) => ({
	...protectedErrorResponses(`${recurso}:actualizar`),
	403: errorResponse(`Sin el permiso ${permiso}`),
	404: errorResponse("Organización o proyecto no encontrado"),
});

/** Se monta en `/api/organizaciones/{organizacionId}/proyectos` (RN-30 a 32). */
export class ProyectoRouter {
	public readonly router = new OpenAPIHono();

	constructor(
		authMiddleware: AuthMiddleware,
		guard: PermisoGuard,
		controller: ProyectoController,
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
			summary: "Proyectos de la organización (cualquier miembro)",
			request: {
				params: organizacionIdParamSchema,
				query: obtenerProyectosSchema,
			},
			responses: {
				200: jsonResponse(z.array(proyectoDtoSchema), "Proyectos"),
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
			summary: "Crear proyecto (proyectos:crear)",
			request: {
				params: organizacionIdParamSchema,
				body: json(crearProyectoSchema),
			},
			responses: {
				201: jsonResponse(proyectoDtoSchema, "Proyecto creado"),
				400: errorResponse("Validación fallida o sin equipos"),
				...escribir("proyectos:crear"),
			},
		});
		this.router.post("/", actualizar, controller.crear);

		docs.registerPath({
			method: "get",
			path: "/{id}",
			tags,
			security,
			summary: "Obtener proyecto",
			request: { params: proyectoParamsSchema },
			responses: {
				200: jsonResponse(proyectoDtoSchema, "Proyecto"),
				...protectedErrorResponses(`${recurso}:leer`),
				404: errorResponse("Organización o proyecto no encontrado"),
			},
		});
		this.router.get("/:id", leer, controller.obtenerUno);

		docs.registerPath({
			method: "put",
			path: "/{id}",
			tags,
			security,
			summary: "Editar datos, estado, equipos e integrantes (proyectos:editar)",
			request: {
				params: proyectoParamsSchema,
				body: json(actualizarProyectoSchema),
			},
			responses: {
				200: jsonResponse(proyectoDtoSchema, "Proyecto actualizado"),
				400: errorResponse("Validación fallida o sin equipos"),
				...escribir("proyectos:editar"),
			},
		});
		this.router.put("/:id", actualizar, controller.actualizar);

		docs.registerPath({
			method: "delete",
			path: "/{id}",
			tags,
			security,
			summary: "Eliminar proyecto (proyectos:eliminar)",
			request: { params: proyectoParamsSchema },
			responses: {
				204: { description: "Proyecto eliminado" },
				...escribir("proyectos:eliminar"),
			},
		});
		this.router.delete("/:id", actualizar, controller.eliminar);
	}
}
