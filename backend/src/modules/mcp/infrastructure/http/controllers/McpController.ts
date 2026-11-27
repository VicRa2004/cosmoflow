import {
	CLIENT_INFO_META_KEY,
	createMcpHandler,
	McpServer,
	TRACEPARENT_META_KEY,
} from "@modelcontextprotocol/server";
import type { Context } from "hono";
import { idDeTraza } from "@/core/shared/infrastructure/monitoreo";
import { type Api, registrarHerramientas } from "../../herramientas";
import { instrucciones } from "../../instrucciones";

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
		const { cliente, traceparent } = datosDe(
			requestInfo && this.cuerpos.get(requestInfo),
			requestInfo?.headers.get("traceparent"),
		);
		const servidor = new McpServer(
			{ name: "cosmoflow", version: "1.0.0" },
			{ instructions: instrucciones(cliente) },
		);
		registrarHerramientas(
			servidor,
			this.api(requestInfo?.headers.get("Authorization") ?? "", traceparent),
		);
		return servidor;
	});

	/** El cuerpo ya leído de cada petición, para que la fábrica sepa el cliente y la traza. */
	private readonly cuerpos = new WeakMap<Request, unknown>();

	ejecutar = async (c: Context): Promise<Response> => {
		const peticion = c.req.raw;
		const cuerpo: unknown = await peticion
			.clone()
			.json()
			.catch(() => undefined);
		if (cuerpo === undefined) return this.handler.fetch(peticion);
		this.cuerpos.set(peticion, cuerpo);
		return this.handler.fetch(peticion, { parsedBody: cuerpo });
	};

	/** Sin SSE ni sesiones (spec MCP: un servidor sin stream responde 405 al GET). */
	noAdmitido = (c: Context): Response => {
		c.header("Allow", "POST");
		return c.json({ error: "Método no admitido" }, 405);
	};

	private api(autorizacion: string, traceparent?: string): Api {
		return async (metodo, ruta, cuerpo) => {
			const res = await this.despachar(ruta, {
				method: metodo,
				headers: {
					Authorization: autorizacion,
					...(traceparent && { traceparent }),
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

type Registro = Record<string, unknown>;
const comoRegistro = (valor: unknown): Registro | undefined =>
	typeof valor === "object" && valor !== null && !Array.isArray(valor)
		? (valor as Registro)
		: undefined;

/**
 * Cliente y traza de la petición: en la spec 2026-07-28 van en `_meta` de cada una;
 * en la 2025, el cliente solo viene en `initialize` (es cuando se leen las instrucciones).
 */
function datosDe(
	cuerpo: unknown,
	cabeceraTraza?: string | null,
): { cliente?: string; traceparent?: string } {
	const params = comoRegistro(comoRegistro(cuerpo)?.params);
	const meta = comoRegistro(params?._meta);
	const info =
		comoRegistro(meta?.[CLIENT_INFO_META_KEY]) ??
		comoRegistro(params?.clientInfo);
	const traza = meta?.[TRACEPARENT_META_KEY] ?? cabeceraTraza;
	return {
		cliente: typeof info?.name === "string" ? info.name : undefined,
		// Solo una cabecera W3C válida: otro valor rompería la llamada a la API.
		traceparent: idDeTraza(traza) ? (traza as string) : undefined,
	};
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
