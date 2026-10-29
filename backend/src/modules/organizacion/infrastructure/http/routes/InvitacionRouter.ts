import { OpenAPIHono, z } from "@hono/zod-openapi";
import {
	errorResponse,
	jsonResponse,
	protectedErrorResponses,
} from "@/core/shared/infrastructure/http/openapi";
import type { PermisoGuard } from "@/core/shared/infrastructure/http/permisoGuard";
import { rateLimit } from "@/core/shared/infrastructure/http/rateLimit";
import type { AuthMiddleware } from "@/modules/auth";
import type { InvitacionController } from "../controllers/InvitacionController";
import {
	invitacionDtoSchema,
	invitacionParamsSchema,
	invitarSchema,
} from "../schemas/invitacionSchemas";
import { organizacionIdSchema } from "../schemas/organizacionSchemas";

const tags = ["Invitaciones"];
const security = [{ bearerAuth: [] }];
const recurso = "organizaciones";
const soloAdmin = {
	...protectedErrorResponses(`${recurso}:actualizar`),
	403: errorResponse("Sin el permiso miembros:invitar"),
};

/** Se monta en `/api/organizaciones`: `/{id}/invitaciones...`. Permiso `miembros:invitar`. */
export class InvitacionRouter {
	public readonly router = new OpenAPIHono();

	constructor(
		authMiddleware: AuthMiddleware,
		guard: PermisoGuard,
		controller: InvitacionController,
	) {
		const docs = this.router.openAPIRegistry;
		// Cada envío es un correo: frena el spam desde una cuenta comprometida.
		const limiteCorreos = rateLimit({ windowMs: 60 * 60 * 1000, limit: 30 });
		this.router.use("/:id/invitaciones/*", authMiddleware.handle);

		docs.registerPath({
			method: "get",
			path: "/{id}/invitaciones",
			tags,
			security,
			summary: "Invitaciones pendientes (caducadas incluidas)",
			request: { params: organizacionIdSchema },
			responses: {
				200: jsonResponse(z.array(invitacionDtoSchema), "Pendientes"),
				...soloAdmin,
				404: errorResponse("Organización no encontrada"),
			},
		});
		this.router.get(
			"/:id/invitaciones",
			guard.handle(recurso, "actualizar"),
			controller.obtenerTodas,
		);

		docs.registerPath({
			method: "post",
			path: "/{id}/invitaciones",
			tags,
			security,
			summary: "Invitar por correo (RN-12)",
			request: {
				params: organizacionIdSchema,
				body: {
					required: true,
					content: { "application/json": { schema: invitarSchema } },
				},
			},
			responses: {
				201: jsonResponse(invitacionDtoSchema, "Invitación enviada"),
				400: errorResponse("Email no válido"),
				...soloAdmin,
				404: errorResponse("Organización no encontrada"),
				409: errorResponse("Ya es miembro o ya tiene una invitación pendiente"),
				429: errorResponse("Demasiadas invitaciones; prueba más tarde"),
			},
		});
		this.router.post(
			"/:id/invitaciones",
			limiteCorreos,
			guard.handle(recurso, "actualizar"),
			controller.invitar,
		);

		docs.registerPath({
			method: "post",
			path: "/{id}/invitaciones/{invitacionId}/reenviar",
			tags,
			security,
			summary: "Reenviar con enlace y caducidad nuevos",
			request: { params: invitacionParamsSchema },
			responses: {
				200: jsonResponse(invitacionDtoSchema, "Invitación reenviada"),
				...soloAdmin,
				404: errorResponse("Organización o invitación no encontradas"),
				410: errorResponse("La invitación ya se respondió o se canceló"),
				429: errorResponse("Demasiadas invitaciones; prueba más tarde"),
			},
		});
		this.router.post(
			"/:id/invitaciones/:invitacionId/reenviar",
			limiteCorreos,
			guard.handle(recurso, "actualizar"),
			controller.reenviar,
		);

		docs.registerPath({
			method: "delete",
			path: "/{id}/invitaciones/{invitacionId}",
			tags,
			security,
			summary: "Cancelar una invitación pendiente",
			request: { params: invitacionParamsSchema },
			responses: {
				204: { description: "Invitación cancelada" },
				...soloAdmin,
				404: errorResponse("Organización o invitación no encontradas"),
				410: errorResponse("La invitación ya se respondió o se canceló"),
			},
		});
		this.router.delete(
			"/:id/invitaciones/:invitacionId",
			guard.handle(recurso, "actualizar"),
			controller.cancelar,
		);
	}
}
