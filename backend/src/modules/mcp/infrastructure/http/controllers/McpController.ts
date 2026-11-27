import { createMcpHandler, McpServer } from "@modelcontextprotocol/server";
import type { Context } from "hono";
import { type Api, registrarHerramientas } from "../../herramientas";

/** Despacha una petición contra la propia app, por ejemplo `app.request`. */
type Despachar = (
	ruta: string,
	init: RequestInit,
) => Response | Promise<Response>;

export class McpController {
	constructor(private readonly despachar: Despachar) {}

	/**
	 * Sin estado: cada petición crea su servidor. Sirve la spec 2026-07-28 y,
	 * para los clientes que aún hacen `initialize`, la 2025-11-25.
	 */
	private readonly handler = createMcpHandler(({ requestInfo }) => {
		const servidor = new McpServer({ name: "cosmoflow", version: "1.0.0" });
		registrarHerramientas(
			servidor,
			this.api(requestInfo?.headers.get("Authorization") ?? ""),
		);
		return servidor;
	});

	ejecutar = (c: Context): Promise<Response> => this.handler.fetch(c.req.raw);

	/** Sin SSE ni sesiones (spec MCP: un servidor sin stream responde 405 al GET). */
	noAdmitido = (c: Context): Response => {
		c.header("Allow", "POST");
		return c.json({ error: "Método no admitido" }, 405);
	};

	private api(autorizacion: string): Api {
		return async (metodo, ruta, cuerpo) => {
			const res = await this.despachar(ruta, {
				method: metodo,
				headers: {
					Authorization: autorizacion,
					"Content-Type": "application/json",
				},
				body: cuerpo === undefined ? undefined : JSON.stringify(cuerpo),
			});
			const texto = await res.text();
			if (res.ok) return texto ? JSON.parse(texto) : null;
			throw new Error(mensajeDeError(res.status, texto));
		};
	}
}

function mensajeDeError(status: number, texto: string): string {
	try {
		const { error, details } = JSON.parse(texto);
		if (error) {
			return details ? `${error}: ${JSON.stringify(details)}` : String(error);
		}
	} catch {
		// Sin JSON: basta con el código.
	}
	return `La API respondió ${status}`;
}
