import { beforeAll, describe, expect, it } from "bun:test";
import { createHash } from "node:crypto";
import { env } from "@/core/config/env";
import { prisma } from "@/core/config/prisma";
import { app } from "@/core/shared/infrastructure/http/server";
import { PrismaTokenPersonalRepository } from "@/modules/auth/infrastructure/repository/PrismaTokenPersonalRepository";
import { api, crearUsuario, login, vaciarUsuarios } from "@/test/e2e";

const CALLBACK = "https://claude.ai/api/mcp/auth_callback";
const VERIFIER = "v".repeat(43);
const CHALLENGE = createHash("sha256").update(VERIFIER).digest("base64url");

type ResultadoRpc = {
	tools: { name: string }[];
	supportedVersions: string[];
	resultType: string;
	_meta: Record<string, { name: string }>;
	isError?: boolean;
	content: { text: string }[];
};

let siguienteId = 0;

const VERSION = "2026-07-28";
const META = {
	"io.modelcontextprotocol/protocolVersion": VERSION,
	"io.modelcontextprotocol/clientInfo": { name: "e2e", version: "1.0.0" },
	"io.modelcontextprotocol/clientCapabilities": {},
};

/** Petición de la spec 2026-07-28: sin `initialize`, versión y cliente en cada una. */
const postMcp = (
	token: string | undefined,
	method: string,
	params: { name?: string } = {},
) =>
	app.request("/mcp", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			Accept: "application/json, text/event-stream",
			"MCP-Protocol-Version": VERSION,
			"Mcp-Method": method,
			...(params.name ? { "Mcp-Name": params.name } : {}),
			...(token ? { Authorization: `Bearer ${token}` } : {}),
		},
		body: JSON.stringify({
			jsonrpc: "2.0",
			id: ++siguienteId,
			method,
			params: { ...params, _meta: META },
		}),
	});

const rpc = async (
	token: string,
	method: string,
	params: { name?: string; arguments?: unknown } = {},
) => {
	const res = await postMcp(token, method, params);
	expect(res.status).toBe(200);
	return ((await res.json()) as { result: ResultadoRpc }).result;
};

const herramienta = async (token: string, name: string, args = {}) => {
	const { content, isError } = await rpc(token, "tools/call", {
		name,
		arguments: args,
	});
	return { texto: content[0]?.text ?? "", isError: isError ?? false };
};

const datos = async (token: string, name: string, args = {}) => {
	const { texto, isError } = await herramienta(token, name, args);
	expect(isError).toBe(false);
	return JSON.parse(texto);
};

const registrarCliente = async () => {
	const res = await api("/api/oauth/registro", {
		method: "POST",
		body: { client_name: "Claude", redirect_uris: [CALLBACK] },
	});
	expect(res.status).toBe(201);
	return ((await res.json()) as { client_id: string }).client_id;
};

const autorizar = async (sesion: string, clientId: string) => {
	const res = await api("/api/oauth/conexion", {
		method: "POST",
		token: sesion,
		body: {
			clientId,
			redirectUri: CALLBACK,
			codeChallenge: CHALLENGE,
			state: "estado-1",
		},
	});
	expect(res.status).toBe(200);
	const { redirectUri } = (await res.json()) as { redirectUri: string };
	return new URL(redirectUri);
};

const canjear = (campos: Record<string, string>) =>
	app.request("/api/oauth/token", {
		method: "POST",
		headers: { "Content-Type": "application/x-www-form-urlencoded" },
		body: new URLSearchParams({
			grant_type: "authorization_code",
			redirect_uri: CALLBACK,
			code_verifier: VERIFIER,
			...campos,
		}),
	});

interface RespuestaToken {
	access_token: string;
	refresh_token: string;
	expires_in: number;
	token_type: string;
}

const renovar = (campos: Record<string, string>) =>
	app.request("/api/oauth/token", {
		method: "POST",
		headers: { "Content-Type": "application/x-www-form-urlencoded" },
		body: new URLSearchParams({ grant_type: "refresh_token", ...campos }),
	});

describe("Conector MCP (e2e)", () => {
	let sesion: string;
	let sesionZoe: string;
	let token: string;
	let tareaAjena: number;

	const conectar = async (deSesion = sesion) => {
		const clientId = await registrarCliente();
		const code = (await autorizar(deSesion, clientId)).searchParams.get(
			"code",
		) as string;
		const res = await canjear({ code, client_id: clientId });
		expect(res.status).toBe(200);
		return { clientId, ...((await res.json()) as RespuestaToken) };
	};

	beforeAll(async () => {
		await vaciarUsuarios();
		await crearUsuario("ana-mcp@x.com", "USUARIO");
		await crearUsuario("zoe-mcp@x.com", "USUARIO");
		sesion = await login("ana-mcp@x.com");
		sesionZoe = await login("zoe-mcp@x.com");
		const res = await api("/api/tareas", {
			method: "POST",
			token: sesionZoe,
			body: { titulo: "De Zoe" },
		});
		tareaAjena = ((await res.json()) as { id: number }).id;
		token = (await conectar()).access_token;
	}, 30_000);

	describe("descubrimiento", () => {
		it("sin token debería responder 401 con la pista de OAuth", async () => {
			const res = await postMcp(undefined, "tools/list");

			expect(res.status).toBe(401);
			expect(res.headers.get("WWW-Authenticate")).toBe(
				`Bearer resource_metadata="${env.APP_URL}/.well-known/oauth-protected-resource"`,
			);
		});

		it.each([
			"/.well-known/oauth-protected-resource",
			"/.well-known/oauth-protected-resource/mcp",
		])("%s debería apuntar al servidor de autorización", async (ruta) => {
			expect(await (await app.request(ruta)).json()).toMatchObject({
				resource: `${env.APP_URL}/mcp`,
				authorization_servers: [env.APP_URL],
			});
		});

		it("debería anunciar PKCE S256, registro y clientes públicos", async () => {
			const res = await app.request("/.well-known/oauth-authorization-server");

			expect(await res.json()).toMatchObject({
				issuer: env.APP_URL,
				authorization_endpoint: `${env.APP_URL}/autorizar-conexion`,
				token_endpoint: `${env.APP_URL}/api/oauth/token`,
				registration_endpoint: `${env.APP_URL}/api/oauth/registro`,
				code_challenge_methods_supported: ["S256"],
				token_endpoint_auth_methods_supported: ["none"],
				authorization_response_iss_parameter_supported: true,
			});
		});

		it.each([
			"/.well-known/oauth-authorization-server",
			"/api/oauth/token",
			"/mcp",
		])("%s debería admitir CORS de cualquier origen", async (ruta) => {
			const res = await app.request(ruta, {
				method: "OPTIONS",
				headers: {
					Origin: "http://localhost:6274",
					"Access-Control-Request-Method": "POST",
				},
			});

			expect(res.headers.get("Access-Control-Allow-Origin")).toBe(
				"http://localhost:6274",
			);
		});

		it("la API de la web no debería abrir CORS a otros orígenes", async () => {
			const res = await app.request("/api/tareas", {
				headers: { Origin: "https://evil.com" },
			});

			expect(res.headers.get("Access-Control-Allow-Origin")).toBeNull();
		});

		it("el 401 debería exponer WWW-Authenticate a los clientes web", async () => {
			const res = await app.request("/mcp", {
				method: "POST",
				headers: { Origin: "http://localhost:6274" },
			});

			expect(res.headers.get("Access-Control-Expose-Headers")).toContain(
				"WWW-Authenticate",
			);
		});
	});

	describe("OAuth", () => {
		it("debería devolver el code y el state al callback de Claude", async () => {
			const url = await autorizar(sesion, await registrarCliente());

			expect(`${url.origin}${url.pathname}`).toBe(CALLBACK);
			expect(url.searchParams.get("state")).toBe("estado-1");
			expect(url.searchParams.get("iss")).toBe(env.APP_URL);
			expect(url.searchParams.get("code")).toMatch(/^[a-f0-9]{64}$/);
		});

		it("el token debería aparecer en el perfil como una conexión revocable", async () => {
			const lista = (await (
				await api("/api/tokens-personales", { token: sesion })
			).json()) as { nombre: string }[];

			expect(lista.map((t) => t.nombre)).toContain("Claude (claude.ai)");
		});

		it("debería dar un acceso de 1 h con refresh token y guardar solo sus hashes", async () => {
			const conexion = await conectar();

			expect(conexion).toMatchObject({
				token_type: "Bearer",
				expires_in: 3600,
			});
			expect(conexion.refresh_token).toStartWith("cfr_");
			const fila = await prisma.tokenPersonal.findFirstOrThrow({
				orderBy: { id: "desc" },
			});
			expect(fila.clientId).toBe(conexion.clientId);
			expect(fila.refreshHash).not.toBe(conexion.refresh_token);
			expect(fila.expiraEn?.getTime()).toBeGreaterThan(Date.now());
		});

		it("renovar debería rotar: lo anterior deja de valer y lo nuevo funciona", async () => {
			const conexion = await conectar();

			const res = await renovar({
				refresh_token: conexion.refresh_token,
				client_id: conexion.clientId,
			});
			expect(res.status).toBe(200);
			expect(res.headers.get("Cache-Control")).toBe("no-store");
			const nueva = (await res.json()) as RespuestaToken;

			expect((await postMcp(nueva.access_token, "tools/list")).status).toBe(
				200,
			);
			expect((await postMcp(conexion.access_token, "tools/list")).status).toBe(
				401,
			);
			const reuso = await renovar({
				refresh_token: conexion.refresh_token,
				client_id: conexion.clientId,
			});
			expect(await reuso.json()).toMatchObject({ error: "invalid_grant" });
			// Sigue siendo la misma conexión del perfil, no una nueva.
			const lista = (await (
				await api("/api/tokens-personales", { token: sesion })
			).json()) as { id: number }[];
			expect(new Set(lista.map((t) => t.id)).size).toBe(lista.length);
		});

		it("renovar debería exigir el mismo client_id y una conexión viva", async () => {
			const conexion = await conectar();

			const otroCliente = await renovar({
				refresh_token: conexion.refresh_token,
				client_id: "otro",
			});
			expect(await otroCliente.json()).toMatchObject({
				error: "invalid_grant",
			});

			const [ultima] = (await (
				await api("/api/tokens-personales", { token: sesion })
			).json()) as { id: number }[];
			await api(`/api/tokens-personales/${ultima.id}`, {
				method: "DELETE",
				token: sesion,
			});
			const revocada = await renovar({
				refresh_token: conexion.refresh_token,
				client_id: conexion.clientId,
			});
			expect(await revocada.json()).toMatchObject({ error: "invalid_grant" });
		});

		it("un acceso caducado debería dar 401 con la pista de OAuth", async () => {
			const conexion = await conectar();
			await prisma.tokenPersonal.updateMany({
				where: { clientId: conexion.clientId },
				data: { expiraEn: new Date(Date.now() - 1000) },
			});

			const res = await postMcp(conexion.access_token, "tools/list");

			expect(res.status).toBe(401);
			expect(res.headers.get("WWW-Authenticate")).toContain(
				"resource_metadata",
			);
		});

		it("debería revocar solas las conexiones sin uso, no los tokens creados a mano", async () => {
			const conexion = await conectar();
			const manual = (await (
				await api("/api/tokens-personales", {
					method: "POST",
					token: sesion,
					body: { nombre: "Script" },
				})
			).json()) as { token: string };
			const hace100Dias = new Date(Date.now() - 100 * 24 * 60 * 60 * 1000);
			await prisma.tokenPersonal.updateMany({
				where: {
					OR: [{ clientId: conexion.clientId }, { nombre: "Script" }],
				},
				data: { ultimoUsoEn: hace100Dias, createdAt: hace100Dias },
			});

			await new PrismaTokenPersonalRepository().revocarConexionesSinUso(
				new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
			);

			expect((await postMcp(conexion.access_token, "tools/list")).status).toBe(
				401,
			);
			expect((await postMcp(manual.token, "tools/list")).status).toBe(200);
		});

		it("debería guardar solo el hash del código", async () => {
			const code = (
				await autorizar(sesion, await registrarCliente())
			).searchParams.get("code") as string;

			const filas = await prisma.codigoOAuth.findMany();
			expect(filas.some((f) => f.codigoHash === code)).toBe(false);
		});

		it.each([
			"https://evil.com/cb",
			"http://claude.ai/api/mcp/auth_callback",
			"javascript:alert(1)",
		])("debería rechazar el destino %s en todas las etapas", async (uri) => {
			const registro = await api("/api/oauth/registro", {
				method: "POST",
				body: { redirect_uris: [uri] },
			});
			const consulta = await api(
				`/api/oauth/conexion?redirect_uri=${encodeURIComponent(uri)}`,
				{ token: sesion },
			);
			const permiso = await api("/api/oauth/conexion", {
				method: "POST",
				token: sesion,
				body: { clientId: "x", redirectUri: uri, codeChallenge: CHALLENGE },
			});

			expect([registro.status, consulta.status, permiso.status]).toEqual([
				400, 400, 400,
			]);
		});

		it("debería exigir una sesión para dar permiso: ni anónimo ni con token", async () => {
			const cuerpo = {
				clientId: "x",
				redirectUri: CALLBACK,
				codeChallenge: CHALLENGE,
			};

			const anonimo = await api("/api/oauth/conexion", {
				method: "POST",
				body: cuerpo,
			});
			const conToken = await api("/api/oauth/conexion", {
				method: "POST",
				token,
				body: cuerpo,
			});

			expect(anonimo.status).toBe(401);
			expect(conToken.status).toBe(403);
		});

		it.each([
			["un verifier incorrecto", { code_verifier: "x".repeat(43) }],
			["otro client_id", { client_id: "otro" }],
			["otro redirect_uri", { redirect_uri: "http://localhost:1/cb" }],
		])("debería rechazar y quemar el código con %s", async (_, cambio) => {
			const clientId = await registrarCliente();
			const code = (await autorizar(sesion, clientId)).searchParams.get(
				"code",
			) as string;

			const fallo = await canjear({ code, client_id: clientId, ...cambio });
			expect(fallo.status).toBe(400);
			expect(await fallo.json()).toMatchObject({ error: "invalid_grant" });

			const reintento = await canjear({ code, client_id: clientId });
			expect(reintento.status).toBe(400);
		});

		it("el código debería servir una sola vez, también en paralelo", async () => {
			const clientId = await registrarCliente();
			const code = (await autorizar(sesion, clientId)).searchParams.get(
				"code",
			) as string;

			const respuestas = await Promise.all([
				canjear({ code, client_id: clientId }),
				canjear({ code, client_id: clientId }),
			]);

			expect(respuestas.map((r) => r.status).sort()).toEqual([200, 400]);
		});

		it("debería rechazar un código caducado", async () => {
			const clientId = await registrarCliente();
			const code = (await autorizar(sesion, clientId)).searchParams.get(
				"code",
			) as string;
			await prisma.codigoOAuth.updateMany({
				data: { expiraEn: new Date(Date.now() - 1000) },
			});

			const res = await canjear({ code, client_id: clientId });

			expect(await res.json()).toMatchObject({ error: "invalid_grant" });
		});

		it("el registro debería responder con errores de RFC 7591", async () => {
			const destino = await api("/api/oauth/registro", {
				method: "POST",
				body: { redirect_uris: ["https://evil.com/callback"] },
			});
			const incompleto = await api("/api/oauth/registro", {
				method: "POST",
				body: {},
			});

			expect(destino.status).toBe(400);
			expect(await destino.json()).toMatchObject({
				error: "invalid_redirect_uri",
			});
			expect(await incompleto.json()).toMatchObject({
				error: "invalid_client_metadata",
			});
		});

		it("debería responder con errores OAuth, sin caché", async () => {
			const tipo = await canjear({
				grant_type: "password",
				code: "x",
				client_id: "x",
			});
			const incompleto = await app.request("/api/oauth/token", {
				method: "POST",
				headers: { "Content-Type": "application/x-www-form-urlencoded" },
				body: "grant_type=authorization_code",
			});

			expect(await tipo.json()).toMatchObject({
				error: "unsupported_grant_type",
			});
			expect(await incompleto.json()).toMatchObject({
				error: "invalid_request",
			});
			expect(tipo.headers.get("Cache-Control")).toBe("no-store");
		});
	});

	describe("herramientas", () => {
		it("debería seguir atendiendo a los clientes 2025 (initialize, respuesta SSE)", async () => {
			const res = await app.request("/mcp", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Accept: "application/json, text/event-stream",
					Authorization: `Bearer ${token}`,
				},
				body: JSON.stringify({
					jsonrpc: "2.0",
					id: ++siguienteId,
					method: "initialize",
					params: {
						protocolVersion: "2025-11-25",
						capabilities: {},
						clientInfo: { name: "e2e", version: "1.0.0" },
					},
				}),
			});

			expect(res.status).toBe(200);
			const texto = await res.text();
			expect(texto).toContain('"protocolVersion":"2025-11-25"');
			expect(texto).toContain('"name":"cosmoflow"');
		});

		it("debería anunciarse con server/discover y listar todas", async () => {
			const descubierto = await rpc(token, "server/discover");
			const { tools } = await rpc(token, "tools/list");

			expect(descubierto.supportedVersions).toContain(VERSION);
			expect(
				descubierto._meta["io.modelcontextprotocol/serverInfo"]?.name,
			).toBe("cosmoflow");
			expect(tools.map((t) => t.name).sort()).toEqual([
				"actualizar_nota",
				"actualizar_tarea",
				"buscar_notas",
				"comentar_tarea",
				"completar_tarea",
				"crear_carpeta",
				"crear_equipo",
				"crear_nota",
				"crear_proyecto",
				"crear_tag",
				"crear_tarea",
				"eliminar_nota",
				"eliminar_tarea",
				"listar_carpetas",
				"listar_comentarios",
				"listar_equipos",
				"listar_miembros",
				"listar_notificaciones",
				"listar_organizaciones",
				"listar_pendientes",
				"listar_plantillas",
				"listar_proyectos",
				"listar_tags",
				"listar_tareas",
				"marcar_notificaciones_leidas",
				"mover_tarea",
				"obtener_nota",
				"obtener_tarea",
				"restaurar_nota",
				"restaurar_tarea",
			]);
		});

		it("debería listar las plantillas personales", async () => {
			await api("/api/plantillas", {
				method: "POST",
				token,
				body: { nombre: "Release", titulo: "Publicar" },
			});
			const plantillas = await datos(token, "listar_plantillas");
			expect(plantillas).toMatchObject([
				{ nombre: "Release", titulo: "Publicar" },
			]);
		});

		it("debería crear, listar y completar una tarea", async () => {
			const tarea = await datos(token, "crear_tarea", {
				titulo: "Desde MCP",
				prioridad: "alta",
				fechaVencimiento: "2030-01-15",
			});
			expect(tarea).toMatchObject({
				titulo: "Desde MCP",
				prioridad: "alta",
				fechaVencimiento: "2030-01-15",
			});

			const antes = await datos(token, "listar_pendientes");
			expect(antes.datos.map((t: { id: number }) => t.id)).toEqual([tarea.id]);

			await datos(token, "completar_tarea", { id: tarea.id });

			const despues = await datos(token, "listar_pendientes");
			expect(despues.datos).toEqual([]);
		});

		it("debería editar una tarea personal, moverla a un proyecto y asignarla", async () => {
			const org = (await (
				await api("/api/organizaciones", {
					method: "POST",
					token: sesion,
					body: { nombre: "Granja", color: "#6366f1" },
				})
			).json()) as { id: number };
			const [yo] = await datos(token, "listar_miembros", {
				organizacionId: org.id,
			});
			await api(`/api/organizaciones/${org.id}/proyectos`, {
				method: "POST",
				token: sesion,
				body: { nombre: "Ganadero", integranteIds: [yo.usuarioId] },
			});
			const [proyecto] = await datos(token, "listar_proyectos", {
				organizacionId: org.id,
			});
			const tarea = await datos(token, "crear_tarea", { titulo: "Vacunas" });

			const editada = await datos(token, "actualizar_tarea", {
				id: tarea.id,
				titulo: "Vacunar terneros",
				contenido: "- [ ] Lote 1",
				estado: "en_progreso",
				prioridad: "alta",
				fechaInicio: "2030-01-01",
				fechaVencimiento: "2030-01-10",
				color: "#f59e0b",
			});
			const movida = await datos(token, "mover_tarea", {
				id: tarea.id,
				proyectoId: proyecto.id,
			});
			const asignada = await datos(token, "actualizar_tarea", {
				id: tarea.id,
				responsableIds: [yo.usuarioId],
				fechaInicio: null,
			});
			const lista = await datos(token, "listar_tareas", {
				proyectoId: proyecto.id,
			});

			expect(editada).toMatchObject({
				titulo: "Vacunar terneros",
				contenido: "- [ ] Lote 1",
				estado: "en_progreso",
				prioridad: "alta",
				fechaVencimiento: "2030-01-10",
				color: "#f59e0b",
			});
			expect(movida.proyectoId).toBe(proyecto.id);
			expect(asignada).toMatchObject({
				responsableIds: [yo.usuarioId],
				fechaInicio: null,
			});
			expect(lista.datos.map((t: { id: number }) => t.id)).toEqual([tarea.id]);
			expect(await datos(token, "obtener_tarea", { id: tarea.id })).toEqual(
				asignada,
			);
		});

		it("debería comentar una tarea y leer sus comentarios", async () => {
			const tarea = await datos(token, "crear_tarea", { titulo: "Comentable" });

			const comentario = await datos(token, "comentar_tarea", {
				id: tarea.id,
				contenido: "Hecho desde Claude",
			});
			const { datos: lista } = await datos(token, "listar_comentarios", {
				id: tarea.id,
			});

			expect(comentario).toMatchObject({
				tareaId: tarea.id,
				contenido: "Hecho desde Claude",
			});
			expect(lista.map((c: { id: number }) => c.id)).toEqual([comentario.id]);
		});

		it("debería crear y buscar notas", async () => {
			await datos(token, "crear_nota", {
				titulo: "Viaje a Lisboa",
				contenido: "Tranvía",
			});
			await datos(token, "crear_nota", { titulo: "Compras" });

			const { datos: halladas } = await datos(token, "buscar_notas", {
				busqueda: "Lisboa",
			});

			expect(halladas.map((n: { titulo: string }) => n.titulo)).toEqual([
				"Viaje a Lisboa",
			]);
		});

		it("debería organizar, editar, borrar y restaurar notas", async () => {
			const carpeta = await datos(token, "crear_carpeta", { nombre: "Viajes" });
			const nota = await datos(token, "crear_nota", {
				titulo: "Oporto",
				carpetaId: carpeta.id,
			});

			const editada = await datos(token, "actualizar_nota", {
				id: nota.id,
				contenido: "Puente de hierro",
				isFijada: true,
			});
			await datos(token, "eliminar_nota", { id: nota.id });
			const borrada = await herramienta(token, "obtener_nota", { id: nota.id });
			await datos(token, "restaurar_nota", { id: nota.id });

			expect(await datos(token, "listar_carpetas")).toMatchObject([
				{ id: carpeta.id, nombre: "Viajes" },
			]);
			expect(editada).toMatchObject({
				titulo: "Oporto",
				contenido: "Puente de hierro",
				isFijada: true,
				carpetaId: carpeta.id,
			});
			expect(borrada.isError).toBe(true);
			expect(await datos(token, "obtener_nota", { id: nota.id })).toMatchObject(
				{ id: nota.id },
			);
		});

		it("debería mandar una tarea a la papelera y restaurarla", async () => {
			const tarea = await datos(token, "crear_tarea", { titulo: "Borrable" });

			await datos(token, "eliminar_tarea", { id: tarea.id });
			const borrada = await herramienta(token, "obtener_tarea", {
				id: tarea.id,
			});
			await datos(token, "restaurar_tarea", { id: tarea.id });

			expect(borrada.isError).toBe(true);
			expect(
				await datos(token, "obtener_tarea", { id: tarea.id }),
			).toMatchObject({ titulo: "Borrable" });
		});

		it("debería listar y marcar como leídas las notificaciones", async () => {
			const { datos: avisos } = await datos(token, "listar_notificaciones", {
				soloNoLeidas: true,
			});
			await datos(token, "marcar_notificaciones_leidas");

			expect(Array.isArray(avisos)).toBe(true);
		});

		it("debería crear proyectos y tags en una organización", async () => {
			const org = (await (
				await api("/api/organizaciones", {
					method: "POST",
					token: sesion,
					body: { nombre: "Taller", color: "#6366f1" },
				})
			).json()) as { id: number };
			const [yo] = await datos(token, "listar_miembros", {
				organizacionId: org.id,
			});

			const proyecto = await datos(token, "crear_proyecto", {
				organizacionId: org.id,
				nombre: "Motores",
				integranteIds: [yo.usuarioId],
			});
			const tag = await datos(token, "crear_tag", {
				organizacionId: org.id,
				nombre: "urgente",
			});
			const personal = await datos(token, "crear_tag", { nombre: "casa" });

			expect(proyecto).toMatchObject({ nombre: "Motores" });
			expect(tag).toMatchObject({ nombre: "urgente" });
			expect(personal).toMatchObject({ nombre: "casa" });
		});

		it("una conexión limitada solo debería hacer lo que permiten sus alcances", async () => {
			const limitado = (await conectar()).access_token;
			const [conexion] = (await (
				await api("/api/tokens-personales", { token: sesion })
			).json()) as { id: number; esConexion: boolean }[];
			const cambio = await api(
				`/api/tokens-personales/${conexion?.id}/alcances`,
				{
					method: "PUT",
					token: sesion,
					body: { alcances: ["tareas:leer"] },
				},
			);
			const autoampliar = await api(
				`/api/tokens-personales/${conexion?.id}/alcances`,
				{ method: "PUT", token: limitado, body: { alcances: null } },
			);

			const leer = await herramienta(limitado, "listar_pendientes");
			const crear = await herramienta(limitado, "crear_tarea", {
				titulo: "No debería",
			});
			const notas = await herramienta(limitado, "buscar_notas");

			expect(cambio.status).toBe(204);
			expect(conexion?.esConexion).toBe(true);
			expect(autoampliar.status).toBe(403);
			expect(leer.isError).toBe(false);
			expect(crear.isError).toBe(true);
			expect(crear.texto).toContain("no tiene permiso");
			expect(notas.isError).toBe(true);
		});

		it("debería devolver como error lo que la API rechaza", async () => {
			const ajena = await herramienta(token, "completar_tarea", {
				id: tareaAjena,
			});
			expect(ajena.isError).toBe(true);
			expect(ajena.texto).toContain("no encontrada");

			const invalida = await herramienta(token, "crear_tarea", { titulo: "" });
			expect(invalida.isError).toBe(true);
		});

		it("no debería ver los datos de otro usuario", async () => {
			const deZoe = (await conectar(sesionZoe)).access_token;

			const { datos: pendientes } = await datos(deZoe, "listar_pendientes");
			const { datos: notas } = await datos(deZoe, "buscar_notas");

			expect(pendientes.map((t: { titulo: string }) => t.titulo)).toEqual([
				"De Zoe",
			]);
			expect(notas).toEqual([]);
		});

		it("no debería admitir GET ni DELETE", async () => {
			const res = await app.request("/mcp", {
				headers: { Authorization: `Bearer ${token}` },
			});

			expect(res.status).toBe(405);
		});

		it("revocar la conexión debería pedir permiso de nuevo", async () => {
			const propio = (await conectar()).access_token;
			const lista = (await (
				await api("/api/tokens-personales", { token: sesion })
			).json()) as { id: number }[];
			const ultima = lista[0] as { id: number };

			await api(`/api/tokens-personales/${ultima.id}`, {
				method: "DELETE",
				token: sesion,
			});
			const res = await postMcp(propio, "tools/list");

			expect(res.status).toBe(401);
			expect(res.headers.get("WWW-Authenticate")).toContain(
				"resource_metadata",
			);
		});
	});
});
