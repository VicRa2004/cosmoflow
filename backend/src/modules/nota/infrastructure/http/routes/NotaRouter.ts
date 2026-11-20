import { OpenAPIHono, z } from "@hono/zod-openapi";
import {
	errorResponse,
	jsonResponse,
	protectedErrorResponses,
} from "@/core/shared/infrastructure/http/openapi";
import type { AuthMiddleware } from "@/modules/auth";
import { idempotencia } from "@/core/shared/infrastructure/http/idempotencia";
import type { PermisoGuard } from "@/core/shared/infrastructure/http/permisoGuard";
import { NotaController } from "../controllers/NotaController";
import type { PapeleraNotaController } from "../controllers/PapeleraNotaController";
import {
	actualizarNotaSchema,
	crearNotaSchema,
	importarNotasSchema,
	obtenerIndiceNotasSchema,
	obtenerNotasSchema,
	notaDtoSchema,
	notaIdSchema,
	notaIndiceDtoSchema,
	notaPaginaSchema,
	papeleraNotasSchema,
	resultadoImportacionSchema,
} from "../schemas/notaSchemas";

const tags = ["Notas"];
const security = [{ bearerAuth: [] }];
const recurso = "notas";

export class NotaRouter {
	public readonly router = new OpenAPIHono();

	constructor(
		authMiddleware: AuthMiddleware,
		guard: PermisoGuard,
		controller: NotaController,
		papelera: PapeleraNotaController,
	) {
		const docs = this.router.openAPIRegistry;
		this.router.use(authMiddleware.handle);

		docs.registerPath({
			method: "post",
			path: "/",
			tags,
			security,
			summary: "Crear nota personal o de un proyecto (RN-33, 50)",
			request: {
				body: {
					required: true,
					content: { "application/json": { schema: crearNotaSchema } },
				},
			},
			responses: {
				201: jsonResponse(notaDtoSchema, "Nota creada"),
				400: errorResponse(
					"Validación fallida, tags ajenos o carpeta inválida",
				),
				404: errorResponse("Proyecto no encontrado"),
				...protectedErrorResponses(`${recurso}:crear`),
			},
		});
		this.router.post(
			"/",
			guard.handle(recurso, "crear"),
			// La app móvil reintenta las altas hechas sin conexión.
			idempotencia,
			controller.crear,
		);

		docs.registerPath({
			method: "post",
			path: "/importar",
			tags,
			security,
			summary:
				"Importar notas de Obsidian con su árbol de carpetas (hasta 200 por petición)",
			request: {
				body: {
					required: true,
					content: { "application/json": { schema: importarNotasSchema } },
				},
			},
			responses: {
				201: jsonResponse(resultadoImportacionSchema, "Notas importadas"),
				400: errorResponse("Validación fallida o carpeta inexistente"),
				404: errorResponse("Proyecto no encontrado"),
				...protectedErrorResponses(`${recurso}:crear`),
			},
		});
		this.router.post(
			"/importar",
			guard.handle(recurso, "crear"),
			controller.importar,
		);

		docs.registerPath({
			method: "get",
			path: "/",
			tags,
			security,
			summary: "Listar notas personales, o las de un proyecto con ?proyectoId",
			request: { query: obtenerNotasSchema },
			responses: {
				200: jsonResponse(notaPaginaSchema, "Lista paginada"),
				400: errorResponse("Parámetros inválidos"),
				404: errorResponse("Proyecto no encontrado"),
				...protectedErrorResponses(`${recurso}:leer`),
			},
		});
		this.router.get(
			"/",
			guard.handle(recurso, "leer"),
			controller.obtenerTodos,
		);

		// Antes de `/:id`, que la capturaría.
		docs.registerPath({
			method: "get",
			path: "/papelera",
			tags,
			security,
			summary: "Papelera de notas",
			description:
				"Las borradas que el usuario aún vería, las borradas más recientemente primero. Se borran del todo a los 30 días.",
			request: { query: papeleraNotasSchema },
			responses: {
				200: jsonResponse(notaPaginaSchema, "Lista paginada"),
				400: errorResponse("Parámetros inválidos"),
				...protectedErrorResponses(`${recurso}:leer`),
			},
		});
		this.router.get(
			"/papelera",
			guard.handle(recurso, "leer"),
			papelera.obtenerTodos,
		);

		docs.registerPath({
			method: "post",
			path: "/papelera/{id}/restaurar",
			tags,
			security,
			summary: "Restaurar una nota de la papelera",
			request: { params: notaIdSchema },
			responses: {
				204: { description: "Nota restaurada" },
				...protectedErrorResponses(`${recurso}:eliminar`),
				404: errorResponse("No está en la papelera"),
			},
		});
		this.router.post(
			"/papelera/:id/restaurar",
			guard.handle(recurso, "eliminar"),
			papelera.restaurar,
		);

		docs.registerPath({
			method: "delete",
			path: "/papelera/{id}",
			tags,
			security,
			summary: "Borrar del todo una nota de la papelera",
			request: { params: notaIdSchema },
			responses: {
				204: { description: "Nota borrada" },
				...protectedErrorResponses(`${recurso}:eliminar`),
				404: errorResponse("No está en la papelera"),
			},
		});
		this.router.delete(
			"/papelera/:id",
			guard.handle(recurso, "eliminar"),
			papelera.eliminar,
		);

		docs.registerPath({
			method: "get",
			path: "/indice",
			tags,
			security,
			summary:
				"Todas las notas del ámbito sin contenido (explorador), con los filtros del listado",
			request: { query: obtenerIndiceNotasSchema },
			responses: {
				200: jsonResponse(z.array(notaIndiceDtoSchema), "Índice de notas"),
				400: errorResponse("Parámetros inválidos"),
				404: errorResponse("Proyecto no encontrado"),
				...protectedErrorResponses(`${recurso}:leer`),
			},
		});
		this.router.get(
			"/indice",
			guard.handle(recurso, "leer"),
			controller.obtenerIndice,
		);

		docs.registerPath({
			method: "get",
			path: "/{id}",
			tags,
			security,
			summary: "Obtener nota por ID",
			request: { params: notaIdSchema },
			responses: {
				200: jsonResponse(notaDtoSchema, "Nota encontrada"),
				...protectedErrorResponses(`${recurso}:leer`),
				404: errorResponse("Nota no encontrada"),
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
			summary: "Actualizar nota",
			request: {
				params: notaIdSchema,
				body: {
					required: true,
					content: { "application/json": { schema: actualizarNotaSchema } },
				},
			},
			responses: {
				200: jsonResponse(notaDtoSchema, "Nota actualizada"),
				400: errorResponse(
					"Validación fallida, tags ajenos o carpeta inválida",
				),
				...protectedErrorResponses(`${recurso}:actualizar`),
				404: errorResponse("Nota no encontrada"),
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
			summary: "Eliminar nota",
			request: { params: notaIdSchema },
			responses: {
				204: { description: "Nota eliminada" },
				...protectedErrorResponses(`${recurso}:eliminar`),
				404: errorResponse("Nota no encontrada"),
			},
		});
		this.router.delete(
			"/:id",
			guard.handle(recurso, "eliminar"),
			controller.eliminar,
		);
	}
}
