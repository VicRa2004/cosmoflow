import { OpenAPIHono, z } from "@hono/zod-openapi";
import {
	errorResponse,
	jsonResponse,
	protectedErrorResponses,
} from "@/core/shared/infrastructure/http/openapi";
import type { PermisoGuard } from "@/core/shared/infrastructure/http/permisoGuard";
import type { AuthMiddleware } from "@/modules/auth";
import type { CarpetaController } from "../controllers/CarpetaController";
import {
	actualizarCarpetaSchema,
	carpetaDtoSchema,
	carpetaIdSchema,
	crearCarpetaSchema,
	obtenerCarpetasSchema,
} from "../schemas/carpetaSchemas";

const tags = ["Carpetas de notas"];
const security = [{ bearerAuth: [] }];
// Las carpetas son parte de las notas: mismos permisos.
const recurso = "notas";

export class CarpetaRouter {
	public readonly router = new OpenAPIHono();

	constructor(
		authMiddleware: AuthMiddleware,
		guard: PermisoGuard,
		controller: CarpetaController,
	) {
		const docs = this.router.openAPIRegistry;
		this.router.use(authMiddleware.handle);

		docs.registerPath({
			method: "post",
			path: "/",
			tags,
			security,
			summary: "Crear carpeta personal o de un proyecto",
			request: {
				body: {
					required: true,
					content: { "application/json": { schema: crearCarpetaSchema } },
				},
			},
			responses: {
				201: jsonResponse(carpetaDtoSchema, "Carpeta creada"),
				400: errorResponse("Validación fallida o carpeta padre inválida"),
				404: errorResponse("Proyecto no encontrado"),
				...protectedErrorResponses(`${recurso}:crear`),
			},
		});
		this.router.post("/", guard.handle(recurso, "crear"), controller.crear);

		docs.registerPath({
			method: "get",
			path: "/",
			tags,
			security,
			summary: "Listar todas las carpetas personales, o las de un proyecto",
			request: { query: obtenerCarpetasSchema },
			responses: {
				200: jsonResponse(z.array(carpetaDtoSchema), "Carpetas por nombre"),
				404: errorResponse("Proyecto no encontrado"),
				...protectedErrorResponses(`${recurso}:leer`),
			},
		});
		this.router.get(
			"/",
			guard.handle(recurso, "leer"),
			controller.obtenerTodos,
		);

		docs.registerPath({
			method: "put",
			path: "/{id}",
			tags,
			security,
			summary: "Renombrar, personalizar o mover una carpeta",
			request: {
				params: carpetaIdSchema,
				body: {
					required: true,
					content: { "application/json": { schema: actualizarCarpetaSchema } },
				},
			},
			responses: {
				200: jsonResponse(carpetaDtoSchema, "Carpeta actualizada"),
				400: errorResponse("Validación fallida o movimiento inválido"),
				...protectedErrorResponses(`${recurso}:actualizar`),
				404: errorResponse("Carpeta no encontrada"),
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
			summary: "Eliminar carpeta (su contenido sube a la carpeta padre)",
			request: { params: carpetaIdSchema },
			responses: {
				204: { description: "Carpeta eliminada" },
				...protectedErrorResponses(`${recurso}:eliminar`),
				404: errorResponse("Carpeta no encontrada"),
			},
		});
		this.router.delete(
			"/:id",
			guard.handle(recurso, "eliminar"),
			controller.eliminar,
		);
	}
}
