import { OpenAPIHono } from "@hono/zod-openapi";
import {
	errorResponse,
	jsonResponse,
	protectedErrorResponses,
} from "@/core/shared/infrastructure/http/openapi";
import type { PermisoGuard } from "@/core/shared/infrastructure/http/permisoGuard";
import { rateLimit } from "@/core/shared/infrastructure/http/rateLimit";
import type { AuthMiddleware } from "@/modules/auth";
import type { RespuestaInvitacionController } from "../controllers/RespuestaInvitacionController";
import {
	invitacionRecibidaDtoSchema,
	respuestaInvitacionSchema,
	tokenInvitacionSchema,
} from "../schemas/invitacionSchemas";

const tags = ["Invitaciones"];
const security = [{ bearerAuth: [] }];
const recurso = "organizaciones";
const body = {
	required: true,
	content: { "application/json": { schema: tokenInvitacionSchema } },
};
const errores = {
	400: errorResponse("Enlace no válido"),
	...protectedErrorResponses(`${recurso}:leer`),
	403: errorResponse("La invitación es para otro email"),
	404: errorResponse("Invitación no encontrada"),
	429: errorResponse("Demasiados intentos; prueba más tarde"),
};

/** Se monta en `/api/invitaciones`: lo que hace quien recibe el enlace, ya con sesión. */
export class RespuestaInvitacionRouter {
	public readonly router = new OpenAPIHono();

	constructor(
		authMiddleware: AuthMiddleware,
		guard: PermisoGuard,
		controller: RespuestaInvitacionController,
	) {
		const docs = this.router.openAPIRegistry;
		this.router.use(
			authMiddleware.handle,
			rateLimit({ windowMs: 15 * 60 * 1000, limit: 30 }),
			guard.handle(recurso, "leer"),
		);

		docs.registerPath({
			method: "post",
			path: "/consultar",
			tags,
			security,
			summary: "Ver a qué organización invita el enlace",
			request: { body },
			responses: {
				200: jsonResponse(invitacionRecibidaDtoSchema, "Invitación"),
				...errores,
			},
		});
		this.router.post("/consultar", controller.consultar);

		for (const [path, summary, handler] of [
			["/aceptar", "Aceptar: entra como miembro", controller.aceptar],
			["/rechazar", "Rechazar la invitación", controller.rechazar],
		] as const) {
			docs.registerPath({
				method: "post",
				path,
				tags,
				security,
				summary,
				request: { body },
				responses: {
					200: jsonResponse(respuestaInvitacionSchema, "Respondida"),
					...errores,
					410: errorResponse("La invitación caducó o ya se respondió"),
				},
			});
			this.router.post(path, handler);
		}
	}
}
