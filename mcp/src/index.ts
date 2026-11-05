import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { crearApi } from "./api";
import { registrarHerramientas } from "./herramientas";

const { COSMOFLOW_URL, COSMOFLOW_TOKEN } = process.env;
if (!COSMOFLOW_URL || !COSMOFLOW_TOKEN) {
	// stdout es del protocolo: cualquier mensaje va por stderr.
	console.error("Define COSMOFLOW_URL y COSMOFLOW_TOKEN (ver mcp/AGENTS.md).");
	process.exit(1);
}

const servidor = new McpServer({ name: "cosmoflow", version: "1.0.0" });
registrarHerramientas(servidor, crearApi(COSMOFLOW_URL, COSMOFLOW_TOKEN));
await servidor.connect(new StdioServerTransport());
