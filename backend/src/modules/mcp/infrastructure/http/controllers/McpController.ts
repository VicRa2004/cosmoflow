import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import type { Context } from "hono";
import { type Api, registrarHerramientas } from "../../herramientas";

/** Despacha una petición contra la propia app, por ejemplo `app.request`. */
type Despachar = (
	ruta: string,
	init: RequestInit,
) => Response | Promise<Response>;

export class McpController {
	constructor(private readonly despachar: Despachar) {}

	/** Sin sesión: cada POST crea su servidor, así no hay estado que perder entre peticiones. */
	ejecutar = async (c: Context): Promise<Response> => {
		const servidor = new McpServer({ name: "cosmoflow", version: "1.0.0" });
		registrarHerramientas(
			servidor,
			this.api(c.req.header("Authorization") ?? ""),
		);
		const transporte = new WebStandardStreamableHTTPServerTransport({
			sessionIdGenerator: undefined,
			enableJsonResponse: true,
		});
		await servidor.connect(transporte);
		return transporte.handleRequest(c.req.raw);
	};

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
