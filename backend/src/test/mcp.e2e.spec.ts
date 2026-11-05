import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { app } from "@/core/shared/infrastructure/http/server";
import { api, crearUsuario, login, vaciarUsuarios } from "@/test/e2e";

type RespuestaRpc = {
	id: number;
	result: {
		tools: { name: string }[];
		isError?: boolean;
		content: { text: string }[];
	};
};

/**
 * De extremo a extremo: el proceso real de `mcp/` por stdio contra la API real. Habla
 * JSON-RPC a mano para no llevar el SDK a las dependencias del backend (van en la imagen).
 */
describe("Servidor MCP (e2e)", () => {
	let jwt: string;
	let tokenId: number;
	let tareaAjena: number;
	let servidorApi: ReturnType<typeof Bun.serve>;
	let mcp: Bun.Subprocess<"pipe", "pipe", "inherit">;
	let lector: ReadableStreamDefaultReader<Uint8Array>;
	let pendiente = "";
	let siguienteId = 0;

	const enviar = async (mensaje: object) => {
		mcp.stdin.write(`${JSON.stringify({ jsonrpc: "2.0", ...mensaje })}\n`);
		await mcp.stdin.flush();
	};

	const leerLinea = async (): Promise<string> => {
		while (!pendiente.includes("\n")) {
			const { value, done } = await lector.read();
			if (done) throw new Error("El servidor MCP terminó");
			pendiente += new TextDecoder().decode(value);
		}
		const fin = pendiente.indexOf("\n");
		const linea = pendiente.slice(0, fin);
		pendiente = pendiente.slice(fin + 1);
		return linea;
	};

	const rpc = async (method: string, params: object = {}) => {
		const id = ++siguienteId;
		await enviar({ id, method, params });
		// stdout es solo del protocolo: cualquier otra línea rompería este JSON.parse.
		const respuesta = JSON.parse(await leerLinea()) as RespuestaRpc;
		expect(respuesta.id).toBe(id);
		return respuesta.result;
	};

	const herramienta = async (name: string, args: object = {}) => {
		const { content, isError } = await rpc("tools/call", {
			name,
			arguments: args,
		});
		return { texto: content[0]?.text ?? "", isError: isError ?? false };
	};

	const datos = async (name: string, args: object = {}) => {
		const { texto, isError } = await herramienta(name, args);
		expect(isError).toBe(false);
		return JSON.parse(texto);
	};

	beforeAll(async () => {
		await vaciarUsuarios();
		await crearUsuario("ana-mcp@x.com", "USUARIO");
		await crearUsuario("zoe-mcp@x.com", "USUARIO");
		jwt = await login("ana-mcp@x.com");
		const res = await api("/api/tareas", {
			method: "POST",
			token: await login("zoe-mcp@x.com"),
			body: { titulo: "De Zoe" },
		});
		tareaAjena = ((await res.json()) as { id: number }).id;

		const creado = await api("/api/tokens-personales", {
			method: "POST",
			token: jwt,
			body: { nombre: "MCP" },
		});
		const { id, token } = (await creado.json()) as {
			id: number;
			token: string;
		};
		tokenId = id;

		servidorApi = Bun.serve({ port: 0, fetch: app.fetch });
		mcp = Bun.spawn(["bun", "src/index.ts"], {
			cwd: `${import.meta.dir}/../../../mcp`,
			// Sin el entorno del backend: el servidor solo conoce la URL y el token.
			env: {
				PATH: process.env.PATH,
				COSMOFLOW_URL: servidorApi.url.href,
				COSMOFLOW_TOKEN: token,
			},
			stdin: "pipe",
			stdout: "pipe",
			stderr: "inherit",
		});
		lector = mcp.stdout.getReader();

		await rpc("initialize", {
			protocolVersion: "2025-06-18",
			capabilities: {},
			clientInfo: { name: "e2e", version: "1.0.0" },
		});
		await enviar({ method: "notifications/initialized" });
	}, 30_000);

	afterAll(() => {
		mcp?.kill();
		servidorApi?.stop(true);
	});

	it("debería anunciar las cinco herramientas", async () => {
		const { tools } = await rpc("tools/list");

		expect(tools.map((t) => t.name).sort()).toEqual([
			"buscar_notas",
			"completar_tarea",
			"crear_nota",
			"crear_tarea",
			"listar_pendientes",
		]);
	});

	it("debería crear, listar y completar una tarea", async () => {
		const tarea = await datos("crear_tarea", {
			titulo: "Desde MCP",
			prioridad: "alta",
			fechaVencimiento: "2030-01-15",
		});
		expect(tarea).toMatchObject({
			titulo: "Desde MCP",
			prioridad: "alta",
			fechaVencimiento: "2030-01-15",
		});

		const antes = await datos("listar_pendientes");
		expect(antes.datos.map((t: { id: number }) => t.id)).toEqual([tarea.id]);

		await datos("completar_tarea", { id: tarea.id });

		const despues = await datos("listar_pendientes");
		expect(despues.datos).toEqual([]);
	});

	it("debería crear y buscar notas", async () => {
		await datos("crear_nota", {
			titulo: "Viaje a Lisboa",
			contenido: "Tranvía",
		});
		await datos("crear_nota", { titulo: "Compras" });

		const { datos: halladas } = await datos("buscar_notas", {
			busqueda: "Lisboa",
		});

		expect(halladas.map((n: { titulo: string }) => n.titulo)).toEqual([
			"Viaje a Lisboa",
		]);
	});

	it("debería devolver como error lo que la API rechaza", async () => {
		const ajena = await herramienta("completar_tarea", { id: tareaAjena });
		expect(ajena.isError).toBe(true);
		expect(ajena.texto).toContain("no encontrada");

		const invalida = await herramienta("crear_tarea", { titulo: "" });
		expect(invalida.isError).toBe(true);
	});

	// Debe ser el último: deja al servidor sin credenciales.
	it("debería dejar de funcionar al revocar el token", async () => {
		const res = await api(`/api/tokens-personales/${tokenId}`, {
			method: "DELETE",
			token: jwt,
		});
		expect(res.status).toBe(204);

		const { texto, isError } = await herramienta("listar_pendientes");

		expect(isError).toBe(true);
		expect(texto).toContain("revocado");
	});
});
