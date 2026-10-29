import { OpenAPIHono, z } from "@hono/zod-openapi";
import { bodyLimit } from "hono/body-limit";
import {
	errorResponse,
	jsonResponse,
	protectedErrorResponses,
} from "@/core/shared/infrastructure/http/openapi";
import type { PermisoGuard } from "@/core/shared/infrastructure/http/permisoGuard";
import type { AuthMiddleware } from "@/modules/auth";
import { ADJUNTO_MAX_BYTES } from "../../../application/useCases/SubirAdjuntoUseCase";
import type { AdjuntoController } from "../controllers/AdjuntoController";
import {
	adjuntoDtoSchema,
	adjuntoIdSchema,
	ambitoAdjuntoQuerySchema,
} from "../schemas/adjuntoSchemas";

const tags = ["Adjuntos"];
const security = [{ bearerAuth: [] }];
const recurso = "adjuntos";

export class AdjuntoRouter {
	public readonly router = new OpenAPIHono();

	constructor(
		authMiddleware: AuthMiddleware,
		guard: PermisoGuard,
		controller: AdjuntoController,
	) {
		const docs = this.router.openAPIRegistry;
		this.router.use(authMiddleware.handle);

		docs.registerPath({
			method: "post",
			path: "/",
			tags,
			security,
			summary:
				"Subir una imagen (multipart, campo «archivo», máx. 5 MB); con organizacionId, equipoId o proyectoId la ven sus miembros",
			request: {
				query: ambitoAdjuntoQuerySchema,
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
				201: jsonResponse(adjuntoDtoSchema, "Imagen guardada"),
				400: errorResponse("Archivo ausente o no es PNG, JPEG ni WebP"),
				...protectedErrorResponses(`${recurso}:crear`),
				404: errorResponse("Organización, equipo o proyecto no encontrado"),
				413: errorResponse("El archivo supera los 5 MB"),
			},
		});
		this.router.post(
			"/",
			guard.handle(recurso, "crear"),
			// Margen para las cabeceras del multipart; el tamaño exacto lo valida el caso de uso.
			bodyLimit({
				maxSize: ADJUNTO_MAX_BYTES + 64 * 1024,
				onError: (c) => c.json({ error: "El archivo supera los 5 MB" }, 413),
			}),
			controller.subir,
		);

		docs.registerPath({
			method: "get",
			path: "/{id}",
			tags,
			security,
			summary:
				"Imagen de un adjunto propio o compartido con una organización, equipo o proyecto del que se es miembro",
			request: { params: adjuntoIdSchema },
			responses: {
				200: {
					description: "Imagen PNG, JPEG o WebP",
					content: {
						"image/*": { schema: z.string().openapi({ format: "binary" }) },
					},
				},
				...protectedErrorResponses(`${recurso}:leer`),
				404: errorResponse("El adjunto no existe o no se puede ver"),
			},
		});
		this.router.get("/:id", guard.handle(recurso, "leer"), controller.obtener);
	}
}
