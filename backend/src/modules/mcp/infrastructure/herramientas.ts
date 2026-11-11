import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";

export type Api = (
	metodo: "GET" | "POST" | "PUT",
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

/** Lo que la API admite al crear y al actualizar, salvo el título. */
const camposTarea = {
	contenido: z.string().optional().describe("Descripción en Markdown"),
	estado: z.enum(ESTADOS).optional(),
	prioridad: z.enum(["baja", "media", "alta"]).optional(),
	fechaInicio: dia,
	fechaVencimiento: dia,
	color: z
		.string()
		.regex(/^#[0-9a-fA-F]{6}$/)
		.nullable()
		.optional()
		.describe("#rrggbb; null lo quita"),
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
				"Lista tareas. Sin destino, las personales; con organizacionId solo, las de la organización (sin equipo ni proyecto); con equipoId o proyectoId, las de ese sitio; asignadas=true, en las que el usuario es responsable.",
			inputSchema: {
				...destino,
				asignadas: z.boolean().optional(),
				busqueda: z.string().min(1).max(128).optional(),
				estado: z.enum(ESTADOS).optional(),
				tagId: id.optional(),
				...paginacion,
			},
			annotations: { readOnlyHint: true },
		},
		({ asignadas, ...args }) =>
			resultado(() =>
				api(
					"GET",
					`/api/tareas?${consulta({ ...args, asignadas: asignadas ? "true" : undefined })}`,
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
			description: "Crea una nota personal del usuario.",
			inputSchema: {
				titulo: z.string().min(1).max(255),
				contenido: z.string().optional().describe("Markdown"),
			},
		},
		(args) => resultado(() => api("POST", "/api/notas", args)),
	);
}
