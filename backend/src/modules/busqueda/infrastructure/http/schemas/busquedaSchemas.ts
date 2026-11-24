import { z } from "@hono/zod-openapi";

export const buscarSchema = z.object({
	q: z
		.string()
		.trim()
		.min(2, "Escribe al menos 2 caracteres")
		.max(100, "Máximo 100 caracteres"),
});

// ── Respuestas (sólo documentación OpenAPI) ──────────────────────────────────

const conTitulo = z.object({ id: z.number().int(), titulo: z.string() });
const deOrganizacion = z.object({
	id: z.number().int(),
	nombre: z.string(),
	organizacionId: z.number().int(),
});

export const resultadosBusquedaSchema = z
	.object({
		tareas: z.array(conTitulo),
		notas: z.array(conTitulo),
		proyectos: z.array(deOrganizacion),
		equipos: z.array(deOrganizacion),
	})
	.openapi("ResultadosBusquedaDto");
