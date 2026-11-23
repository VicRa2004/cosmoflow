import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";

export type Api = (
	metodo: "GET" | "POST" | "PUT" | "DELETE",
	ruta: string,
	cuerpo?: unknown,
) => Promise<unknown>;

const paginacion = {
	pagina: z.number().int().positive().default(1),
	limite: z.number().int().min(1).max(100).default(20),
};

const id = z.number().int().positive();
const dia = z.iso
	.date()
	.nullable()
	.optional()
	.describe("AAAA-MM-DD; null la quita");
// Copia de los de Tarea: el MCP no importa internos de otro módulo (dependency-cruiser).
const ESTADOS = [
	"pendiente",
	"en_progreso",
	"completada",
	"cancelada",
] as const;

const destino = {
	organizacionId: id.optional(),
	equipoId: id.optional(),
	proyectoId: id.optional(),
};

const color = z
	.string()
	.regex(/^#[0-9a-fA-F]{6}$/)
	.nullable()
	.describe("#rrggbb; null lo quita");

/** Lo que la API admite al crear y al actualizar una nota, salvo el título. */
const camposNota = {
	contenido: z.string().max(100_000).optional().describe("Markdown"),
	color: color.optional(),
	isFijada: z.boolean().optional(),
	tagIds: z.array(id).max(50).optional().describe("Reemplaza los tags"),
	carpetaId: id
		.nullable()
		.optional()
		.describe("Carpeta de listar_carpetas; null la saca a la raíz"),
};

/** Lo que la API admite al crear y al actualizar, salvo el título. */
const camposTarea = {
	contenido: z.string().optional().describe("Descripción en Markdown"),
	estado: z.enum(ESTADOS).optional(),
	prioridad: z.enum(["baja", "media", "alta"]).optional(),
	fechaInicio: dia,
	fechaVencimiento: dia,
	color: color.optional(),
	tagIds: z.array(id).max(50).optional().describe("Reemplaza los tags"),
	responsableIds: z
		.array(id)
		.max(50)
		.optional()
		.describe("Reemplaza los responsables; solo en tareas compartidas"),
	dependeDeId: id
		.nullable()
		.optional()
		.describe("Tarea del mismo sitio de la que depende; null la quita"),
	recurrencia: z
		.enum(["diaria", "semanal", "mensual"])
		.nullable()
		.optional()
		.describe("Al completarla se crea la siguiente; null la quita"),
	subtareas: z
		.array(
			z.object({
				titulo: z.string().min(1).max(255),
				completada: z.boolean().optional(),
			}),
		)
		.max(100)
		.optional()
		.describe("Reemplaza la checklist de subtareas en orden"),
};

/** Un fallo de la API se devuelve como resultado: así la IA lo lee y puede corregirlo. */
async function resultado(
	llamada: () => Promise<unknown>,
): Promise<CallToolResult> {
	try {
		const datos = await llamada();
		return {
			content: [{ type: "text", text: JSON.stringify(datos, null, 2) }],
		};
	} catch (error) {
		const text = error instanceof Error ? error.message : String(error);
		return { content: [{ type: "text", text }], isError: true };
	}
}

/** Los opcionales ausentes no viajan: la API validaría `undefined` como texto. */
const consulta = (valores: Record<string, string | number | undefined>) => {
	const parametros = new URLSearchParams();
	for (const [clave, valor] of Object.entries(valores)) {
		if (valor !== undefined) parametros.set(clave, String(valor));
	}
	return parametros.toString();
};

/** Todo pasa por la API REST con el token del usuario: mismos permisos y validaciones, nunca más. */
export function registrarHerramientas(servidor: McpServer, api: Api): void {
	servidor.registerTool(
		"listar_pendientes",
		{
			description:
				"Tareas pendientes y en progreso del usuario (personales y en las que es responsable), por vencimiento más próximo.",
			inputSchema: paginacion,
			annotations: { readOnlyHint: true },
		},
		(args) =>
			resultado(() => api("GET", `/api/tareas/pendientes?${consulta(args)}`)),
	);

	servidor.registerTool(
		"listar_tareas",
		{
			description:
				"Lista tareas. Sin destino, las personales; con organizacionId solo, las de la organización (sin equipo ni proyecto); con equipoId o proyectoId, las de ese sitio; asignadas=true, en las que el usuario es responsable; asignadasPorMi=true, las que asignó a otros.",
			inputSchema: {
				...destino,
				asignadas: z.boolean().optional(),
				asignadasPorMi: z.boolean().optional(),
				busqueda: z.string().min(1).max(128).optional(),
				estado: z.enum(ESTADOS).optional(),
				tagId: id.optional(),
				responsableId: id
					.optional()
					.describe("Solo las que tienen a este miembro como responsable"),
				...paginacion,
			},
			annotations: { readOnlyHint: true },
		},
		({ asignadas, asignadasPorMi, ...args }) =>
			resultado(() =>
				api(
					"GET",
					`/api/tareas?${consulta({
						...args,
						asignadas: asignadas ? "true" : undefined,
						asignadasPorMi: asignadasPorMi ? "true" : undefined,
					})}`,
				),
			),
	);

	servidor.registerTool(
		"obtener_tarea",
		{
			description: "Una tarea por id, con su descripción completa.",
			inputSchema: { id },
			annotations: { readOnlyHint: true },
		},
		({ id }) => resultado(() => api("GET", `/api/tareas/${id}`)),
	);

	servidor.registerTool(
		"crear_tarea",
		{
			description:
				"Crea una tarea. Sin destino es personal; si no, de la organización, de un equipo o de un proyecto (solo uno).",
			inputSchema: {
				titulo: z.string().min(1).max(255),
				...camposTarea,
				...destino,
			},
		},
		(args) => resultado(() => api("POST", "/api/tareas", args)),
	);

	servidor.registerTool(
		"actualizar_tarea",
		{
			description:
				"Cambia las propiedades indicadas de una tarea; las omitidas no se tocan. Sirve para asignar responsables (ids de miembros, solo en tareas compartidas).",
			inputSchema: {
				id,
				titulo: z.string().min(1).max(255).optional(),
				...camposTarea,
			},
			annotations: { idempotentHint: true },
		},
		({ id, ...cambios }) =>
			resultado(() => api("PUT", `/api/tareas/${id}`, cambios)),
	);

	servidor.registerTool(
		"mover_tarea",
		{
			description:
				"Mueve una tarea personal a una organización, un equipo o un proyecto (exactamente uno). No tiene vuelta atrás.",
			inputSchema: { id, ...destino },
		},
		({ id, ...destinos }) =>
			resultado(() => api("POST", `/api/tareas/${id}/mover`, destinos)),
	);

	servidor.registerTool(
		"listar_organizaciones",
		{
			description: "Organizaciones de las que el usuario es miembro.",
			inputSchema: paginacion,
			annotations: { readOnlyHint: true },
		},
		(args) =>
			resultado(() => api("GET", `/api/organizaciones?${consulta(args)}`)),
	);

	for (const [nombre, ruta, que] of [
		["listar_equipos", "equipos", "Equipos"],
		["listar_proyectos", "proyectos", "Proyectos"],
		[
			"listar_miembros",
			"miembros",
			"Miembros (sus ids sirven de responsables)",
		],
	] as const) {
		servidor.registerTool(
			nombre,
			{
				description: `${que} de una organización.`,
				inputSchema: { organizacionId: id },
				annotations: { readOnlyHint: true },
			},
			({ organizacionId }) =>
				resultado(() =>
					api("GET", `/api/organizaciones/${organizacionId}/${ruta}`),
				),
		);
	}

	servidor.registerTool(
		"listar_tags",
		{
			description:
				"Tags personales o, con organizacionId, los de la organización (para tagIds de sus tareas).",
			inputSchema: {
				organizacionId: id.optional(),
				nombre: z.string().min(1).max(128).optional(),
				...paginacion,
			},
			annotations: { readOnlyHint: true },
		},
		({ organizacionId, ...args }) =>
			resultado(() =>
				api(
					"GET",
					`${organizacionId ? `/api/organizaciones/${organizacionId}` : "/api"}/tags?${consulta(args)}`,
				),
			),
	);

	servidor.registerTool(
		"listar_plantillas",
		{
			description:
				"Plantillas de tareas personales o, con organizacionId, las de la organización. Para crear una tarea desde una, pasa sus campos a crear_tarea (cada subtarea como { titulo }).",
			inputSchema: { organizacionId: id.optional() },
			annotations: { readOnlyHint: true },
		},
		({ organizacionId }) =>
			resultado(() =>
				api(
					"GET",
					`${organizacionId ? `/api/organizaciones/${organizacionId}` : "/api"}/plantillas`,
				),
			),
	);

	servidor.registerTool(
		"completar_tarea",
		{
			description: "Marca una tarea como completada.",
			inputSchema: { id: z.number().int().positive() },
			annotations: { idempotentHint: true },
		},
		({ id }) =>
			resultado(() =>
				api("PUT", `/api/tareas/${id}`, { estado: "completada" }),
			),
	);

	servidor.registerTool(
		"comentar_tarea",
		{
			description:
				"Añade un comentario en Markdown a una tarea. Para mencionar a alguien: [@Nombre](mencion:<usuarioId>) (ids de listar_miembros); se avisa a los mencionados, responsables y creador.",
			inputSchema: {
				id: z.number().int().positive(),
				contenido: z.string().min(1).max(10_000),
			},
		},
		({ id, contenido }) =>
			resultado(() =>
				api("POST", `/api/tareas/${id}/comentarios`, { contenido }),
			),
	);

	servidor.registerTool(
		"listar_comentarios",
		{
			description:
				"Comentarios de una tarea, los más antiguos primero (50 por página).",
			inputSchema: {
				id: z.number().int().positive(),
				pagina: z.number().int().positive().optional(),
			},
			annotations: { readOnlyHint: true },
		},
		({ id, ...args }) =>
			resultado(() =>
				api("GET", `/api/tareas/${id}/comentarios?${consulta(args)}`),
			),
	);

	servidor.registerTool(
		"buscar_notas",
		{
			description:
				"Busca en las notas personales del usuario. Sin texto, las lista todas.",
			inputSchema: {
				busqueda: z.string().min(1).max(128).optional(),
				...paginacion,
			},
			annotations: { readOnlyHint: true },
		},
		(args) => resultado(() => api("GET", `/api/notas?${consulta(args)}`)),
	);

	servidor.registerTool(
		"crear_nota",
		{
			description: "Crea una nota personal o, con proyectoId, de un proyecto.",
			inputSchema: {
				titulo: z.string().min(1).max(255),
				...camposNota,
				proyectoId: id.optional(),
			},
		},
		(args) => resultado(() => api("POST", "/api/notas", args)),
	);

	servidor.registerTool(
		"obtener_nota",
		{
			description: "Una nota por id, con su contenido completo.",
			inputSchema: { id },
			annotations: { readOnlyHint: true },
		},
		({ id }) => resultado(() => api("GET", `/api/notas/${id}`)),
	);

	servidor.registerTool(
		"actualizar_nota",
		{
			description:
				"Cambia las propiedades indicadas de una nota; las omitidas no se tocan. El contenido se reemplaza entero.",
			inputSchema: {
				id,
				titulo: z.string().min(1).max(255).optional(),
				...camposNota,
			},
			annotations: { idempotentHint: true },
		},
		({ id, ...cambios }) =>
			resultado(() => api("PUT", `/api/notas/${id}`, cambios)),
	);

	servidor.registerTool(
		"listar_carpetas",
		{
			description:
				"Carpetas de notas personales o, con proyectoId, las de un proyecto (sus ids sirven de carpetaId).",
			inputSchema: { proyectoId: id.optional() },
			annotations: { readOnlyHint: true },
		},
		(args) => resultado(() => api("GET", `/api/carpetas?${consulta(args)}`)),
	);

	servidor.registerTool(
		"crear_carpeta",
		{
			description:
				"Crea una carpeta de notas personal o, con proyectoId, de un proyecto.",
			inputSchema: {
				nombre: z.string().min(1).max(120),
				padreId: id.optional().describe("Carpeta dentro de la que va"),
				proyectoId: id.optional(),
			},
		},
		(args) => resultado(() => api("POST", "/api/carpetas", args)),
	);

	for (const [recurso, que] of [
		["tareas", "tarea"],
		["notas", "nota"],
	] as const) {
		servidor.registerTool(
			`eliminar_${que}`,
			{
				description: `Mueve una ${que} a la papelera; se puede restaurar con restaurar_${que}.`,
				inputSchema: { id },
				annotations: { destructiveHint: true },
			},
			({ id }) => resultado(() => api("DELETE", `/api/${recurso}/${id}`)),
		);

		servidor.registerTool(
			`restaurar_${que}`,
			{
				description: `Saca una ${que} de la papelera.`,
				inputSchema: { id },
				annotations: { idempotentHint: true },
			},
			({ id }) =>
				resultado(() =>
					api("POST", `/api/${recurso}/papelera/${id}/restaurar`),
				),
		);
	}

	servidor.registerTool(
		"listar_notificaciones",
		{
			description:
				"Notificaciones del usuario dentro de la app, las más recientes primero.",
			inputSchema: {
				soloNoLeidas: z.boolean().optional(),
				pagina: paginacion.pagina,
				limite: z.number().int().min(1).max(50).default(20),
			},
			annotations: { readOnlyHint: true },
		},
		({ soloNoLeidas, ...args }) =>
			resultado(() =>
				api(
					"GET",
					`/api/notificaciones?${consulta({
						...args,
						soloNoLeidas: soloNoLeidas ? "true" : undefined,
					})}`,
				),
			),
	);

	servidor.registerTool(
		"marcar_notificaciones_leidas",
		{
			description: "Marca como leída una notificación o, sin id, todas.",
			inputSchema: { id: id.optional() },
			annotations: { idempotentHint: true },
		},
		({ id }) =>
			resultado(() =>
				id
					? api("PUT", `/api/notificaciones/${id}/leer`)
					: api("POST", "/api/notificaciones/leer-todas"),
			),
	);

	servidor.registerTool(
		"crear_proyecto",
		{
			description:
				"Crea un proyecto en una organización. Necesita al menos un equipo o un integrante (ids de listar_equipos / listar_miembros).",
			inputSchema: {
				organizacionId: id,
				nombre: z.string().min(1).max(100),
				descripcion: z.string().max(500).optional(),
				color: color.optional(),
				fechaInicio: dia,
				fechaFin: dia,
				equipoIds: z.array(id).max(500).optional(),
				integranteIds: z.array(id).max(500).optional(),
			},
		},
		({ organizacionId, ...datos }) =>
			resultado(() =>
				api("POST", `/api/organizaciones/${organizacionId}/proyectos`, datos),
			),
	);

	servidor.registerTool(
		"crear_equipo",
		{
			description:
				"Crea un equipo en una organización con al menos 2 miembros (ids de listar_miembros).",
			inputSchema: {
				organizacionId: id,
				nombre: z.string().min(1).max(100),
				descripcion: z.string().max(500).optional(),
				color: z
					.string()
					.regex(/^#[0-9a-fA-F]{6}$/)
					.describe("#rrggbb"),
				miembroIds: z.array(id).min(2).max(500),
				liderId: id.optional(),
			},
		},
		({ organizacionId, ...datos }) =>
			resultado(() =>
				api("POST", `/api/organizaciones/${organizacionId}/equipos`, datos),
			),
	);

	servidor.registerTool(
		"crear_tag",
		{
			description:
				"Crea un tag personal o, con organizacionId, de la organización.",
			inputSchema: {
				organizacionId: id.optional(),
				nombre: z.string().min(1).max(64),
				color: color.optional(),
			},
		},
		({ organizacionId, ...datos }) =>
			resultado(() =>
				api(
					"POST",
					`${organizacionId ? `/api/organizaciones/${organizacionId}` : "/api"}/tags`,
					datos,
				),
			),
	);
}
