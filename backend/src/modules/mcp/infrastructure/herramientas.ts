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
		"crear_tarea",
		{
			description: "Crea una tarea personal del usuario.",
			inputSchema: {
				titulo: z.string().min(1).max(255),
				contenido: z.string().optional().describe("Markdown"),
				prioridad: z.enum(["baja", "media", "alta"]).optional(),
				fechaVencimiento: z.iso.date().optional().describe("AAAA-MM-DD"),
			},
		},
		(args) => resultado(() => api("POST", "/api/tareas", args)),
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
