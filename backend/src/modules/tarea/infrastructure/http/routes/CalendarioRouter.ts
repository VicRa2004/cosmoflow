import { OpenAPIHono } from "@hono/zod-openapi";
import {
	errorResponse,
	jsonResponse,
	protectedErrorResponses,
} from "@/core/shared/infrastructure/http/openapi";
import type { PermisoGuard } from "@/core/shared/infrastructure/http/permisoGuard";
import type { AuthMiddleware } from "@/modules/auth";
import type { CalendarioController } from "../controllers/CalendarioController";
import {
	feedCalendarioSchema,
	suscripcionCalendarioSchema,
	urlCalendarioSchema,
} from "../schemas/calendarioSchemas";

const tags = ["Calendario"];
const security = [{ bearerAuth: [] }];
const recurso = "tareas";

export class CalendarioRouter {
	public readonly router = new OpenAPIHono();

	constructor(
		authMiddleware: AuthMiddleware,
		guard: PermisoGuard,
		controller: CalendarioController,
	) {
		const docs = this.router.openAPIRegistry;
		const auth = authMiddleware.handle;
		const leer = guard.handle(recurso, "leer");

		docs.registerPath({
			method: "get",
			path: "/tareas.ics",
			tags,
			summary: "Feed iCalendar de las tareas",
			description:
				"Público: lo autentica el token de la URL, porque los clientes de calendario no envían cabeceras. Pendientes y en progreso del dueño con fecha, una por día de vencimiento (o de inicio).",
			request: { query: feedCalendarioSchema },
			responses: {
				200: {
					description: "Calendario",
					content: { "text/calendar": { schema: { type: "string" } } },
				},
				400: errorResponse("Token con formato inválido"),
				404: errorResponse("Token desconocido o revocado"),
			},
		});
		// Sin rateLimit por IP: Google Calendar consulta desde IPs compartidas por
		// muchos usuarios, y un token de 192 bits no se adivina por fuerza bruta.
		this.router.get("/tareas.ics", controller.feed);

		docs.registerPath({
			method: "get",
			path: "/suscripcion",
			tags,
			security,
			summary: "Estado de la suscripción al calendario",
			responses: {
				200: jsonResponse(suscripcionCalendarioSchema, "Estado"),
				...protectedErrorResponses(`${recurso}:leer`),
			},
		});
		this.router.get("/suscripcion", auth, leer, controller.obtener);

		docs.registerPath({
			method: "post",
			path: "/suscripcion",
			tags,
			security,
			summary: "Generar (o regenerar) la URL del calendario",
			description:
				"La URL solo se muestra en esta respuesta; generar otra invalida la anterior.",
			responses: {
				201: jsonResponse(urlCalendarioSchema, "URL nueva"),
				...protectedErrorResponses(`${recurso}:leer`),
			},
		});
		this.router.post("/suscripcion", auth, leer, controller.generar);

		docs.registerPath({
			method: "delete",
			path: "/suscripcion",
			tags,
			security,
			summary: "Desactivar la URL del calendario",
			responses: {
				204: { description: "Desactivada" },
				...protectedErrorResponses(`${recurso}:leer`),
			},
		});
		this.router.delete("/suscripcion", auth, leer, controller.revocar);
	}
}
