/**
 * Vistas de MCP Apps (extensión `io.modelcontextprotocol/ui`, spec 2026-01-26): HTML
 * autocontenido que el cliente pinta en un iframe aislado y que habla con él por
 * `postMessage` (JSON-RPC). Sin dependencias ni red: todo dato llega por el host y se
 * pinta con `textContent`, nunca como HTML.
 */
export const MIME_VISTA = "text/html;profile=mcp-app";

export type Vista = "tarea" | "tablero";

export const uriVista = (vista: Vista) => `ui://cosmoflow/${vista}`;

const ESTILOS = `
:root {
	color-scheme: light dark;
	--fondo: var(--color-background-primary, light-dark(#ffffff, #171717));
	--fondo-2: var(--color-background-secondary, light-dark(#f5f5f5, #262626));
	--texto: var(--color-text-primary, light-dark(#171717, #fafafa));
	--suave: var(--color-text-secondary, light-dark(#525252, #a3a3a3));
	--borde: var(--color-border-primary, light-dark(#e5e5e5, #404040));
	--acento: light-dark(#4f46e5, #818cf8);
	--peligro: light-dark(#b91c1c, #f87171);
	--radio: var(--border-radius-md, 8px);
}
* { box-sizing: border-box; }
body {
	margin: 0; padding: 12px; background: var(--fondo); color: var(--texto);
	font: 14px/1.45 var(--font-sans, system-ui, sans-serif);
}
h1 { font-size: 16px; margin: 0 0 6px; }
h2 { font-size: 13px; margin: 0 0 8px; display: flex; justify-content: space-between; }
.suave { color: var(--suave); }
.error { color: var(--peligro); margin: 8px 0 0; }
.chips { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 10px; }
.chip { border: 1px solid var(--borde); border-radius: 999px; padding: 1px 8px; font-size: 12px; }
.alta { color: var(--peligro); border-color: currentColor; }
select, button { font: inherit; color: inherit; background: var(--fondo); border: 1px solid var(--borde); border-radius: var(--radio); padding: 2px 6px; }
ul { list-style: none; margin: 0; padding: 0; }
.checklist li label { display: flex; gap: 8px; align-items: flex-start; padding: 4px 0; cursor: pointer; }
.checklist .hecha { text-decoration: line-through; color: var(--suave); }
.tablero { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px; }
.columna { background: var(--fondo-2); border-radius: var(--radio); padding: 8px; min-height: 80px; }
.columna.encima { outline: 2px dashed var(--acento); }
.tarjeta { background: var(--fondo); border: 1px solid var(--borde); border-radius: var(--radio); padding: 6px 8px; margin-bottom: 6px; cursor: grab; }
.tarjeta p { margin: 0 0 4px; overflow-wrap: anywhere; }
.tarjeta .pie { display: flex; justify-content: space-between; gap: 4px; font-size: 12px; }
:focus-visible { outline: 2px solid var(--acento); outline-offset: 1px; }
@media (max-width: 480px) { .tablero { grid-template-columns: 1fr; } }
`;

/** Puente con el host y las dos vistas; `VISTA` decide cuál se pinta. */
const SCRIPT = `
const ESTADOS = [["pendiente", "Pendiente"], ["en_progreso", "En progreso"], ["completada", "Completada"], ["cancelada", "Cancelada"]];
const app = document.getElementById("app");
const pendientes = new Map();
let siguienteId = 0;

const enviar = (method, params) => new Promise((ok, mal) => {
	const id = ++siguienteId;
	pendientes.set(id, { ok, mal });
	parent.postMessage({ jsonrpc: "2.0", id, method, params }, "*");
});
const avisar = (method, params) => parent.postMessage({ jsonrpc: "2.0", method, params }, "*");

const datosDe = (resultado) => {
	if (resultado?.structuredContent !== undefined) return resultado.structuredContent;
	try { return JSON.parse(resultado?.content?.[0]?.text ?? "null"); } catch { return null; }
};

async function llamar(name, args) {
	const resultado = await enviar("tools/call", { name, arguments: args });
	if (resultado?.isError) throw new Error(resultado.content?.[0]?.text ?? "Error");
	return datosDe(resultado);
}

function el(tag, props = {}, ...hijos) {
	const nodo = document.createElement(tag);
	for (const [clave, valor] of Object.entries(props)) {
		if (clave.startsWith("aria-") || clave === "role") nodo.setAttribute(clave, valor);
		else nodo[clave] = valor;
	}
	nodo.append(...hijos.filter((h) => h !== null && h !== undefined && h !== false));
	return nodo;
}

const dia = (iso) => iso ? new Date(iso + "T00:00:00").toLocaleDateString("es", { day: "numeric", month: "short" }) : null;

function selectorEstado(tarea, alCambiar) {
	const select = el("select", { "aria-label": "Estado de «" + tarea.titulo + "»", disabled: tarea.bloqueada });
	for (const [valor, texto] of ESTADOS) select.append(el("option", { value: valor, textContent: texto, selected: tarea.estado === valor }));
	select.onchange = () => alCambiar(select.value);
	return select;
}

let aviso = null;
function mostrarError(error) {
	aviso?.remove();
	aviso = el("p", { className: "error", role: "alert", textContent: error instanceof Error ? error.message : String(error) });
	app.append(aviso);
}

async function intentar(trabajo) {
	try { await trabajo(); } catch (error) { mostrarError(error); }
}

function pintarTarea(tarea) {
	const hechas = tarea.subtareas.filter((s) => s.completada).length;
	const lista = el("ul", { className: "checklist", "aria-label": "Subtareas" });
	for (const sub of tarea.subtareas) {
		const casilla = el("input", { type: "checkbox", checked: sub.completada });
		casilla.onchange = () => intentar(async () => {
			pintarTarea(await llamar("marcar_subtarea", { id: tarea.id, subtareaId: sub.id, completada: casilla.checked }));
		});
		lista.append(el("li", {}, el("label", {}, casilla, el("span", { className: sub.completada ? "hecha" : "", textContent: sub.titulo }))));
	}
	app.replaceChildren(
		el("h1", { textContent: tarea.titulo }),
		el("div", { className: "chips" },
			selectorEstado(tarea, (estado) => intentar(async () => pintarTarea(await llamar("actualizar_tarea", { id: tarea.id, estado })))),
			el("span", { className: "chip " + tarea.prioridad, textContent: "Prioridad " + tarea.prioridad }),
			tarea.fechaVencimiento && el("span", { className: "chip", textContent: "Vence " + dia(tarea.fechaVencimiento) }),
			tarea.bloqueada && el("span", { className: "chip", textContent: "Bloqueada por otra tarea" }),
		),
		tarea.subtareas.length > 0
			? el("section", {}, el("h2", {}, el("span", { textContent: "Subtareas" }), el("span", { className: "suave", textContent: hechas + "/" + tarea.subtareas.length })), lista)
			: el("p", { className: "suave", textContent: "Sin subtareas." }),
	);
}

let tareas = [];
function pintarTablero() {
	const cambiar = (tarea, estado) => intentar(async () => {
		if (tarea.estado === estado) return;
		const nueva = await llamar("actualizar_tarea", { id: tarea.id, estado });
		tareas = tareas.map((t) => (t.id === nueva.id ? nueva : t));
		pintarTablero();
	});
	const columnas = ESTADOS.slice(0, 3).map(([estado, titulo]) => {
		const deEstado = tareas.filter((t) => t.estado === estado);
		const lista = el("ul", { "aria-label": titulo });
		for (const tarea of deEstado) {
			const tarjeta = el("li", { className: "tarjeta", draggable: !tarea.bloqueada },
				el("p", { textContent: tarea.titulo }),
				el("div", { className: "pie" },
					el("span", { className: tarea.prioridad === "alta" ? "alta" : "suave", textContent: dia(tarea.fechaVencimiento) ?? tarea.prioridad }),
					selectorEstado(tarea, (nuevo) => cambiar(tarea, nuevo)),
				),
			);
			tarjeta.ondragstart = (e) => e.dataTransfer.setData("text/plain", String(tarea.id));
			lista.append(tarjeta);
		}
		const columna = el("section", { className: "columna" },
			el("h2", {}, el("span", { textContent: titulo }), el("span", { className: "suave", textContent: String(deEstado.length) })),
			lista,
		);
		columna.ondragover = (e) => { e.preventDefault(); columna.classList.add("encima"); };
		columna.ondragleave = () => columna.classList.remove("encima");
		columna.ondrop = (e) => {
			e.preventDefault();
			columna.classList.remove("encima");
			const tarea = tareas.find((t) => t.id === Number(e.dataTransfer.getData("text/plain")));
			if (tarea) cambiar(tarea, estado);
		};
		return columna;
	});
	app.replaceChildren(el("div", { className: "tablero" }, ...columnas));
}

function mostrar(resultado) {
	if (resultado?.isError) return mostrarError(resultado.content?.[0]?.text ?? "Error");
	const datos = datosDe(resultado);
	if (!datos) return mostrarError("Respuesta sin datos");
	if (VISTA === "tarea") return pintarTarea(datos);
	tareas = datos.datos ?? [];
	pintarTablero();
}

function aplicarContexto(contexto) {
	if (contexto?.theme) document.documentElement.style.colorScheme = contexto.theme;
	for (const [clave, valor] of Object.entries(contexto?.styles?.variables ?? {})) {
		if (valor) document.documentElement.style.setProperty(clave, valor);
	}
}

addEventListener("message", (evento) => {
	if (evento.source !== parent) return;
	const mensaje = evento.data;
	if (!mensaje || mensaje.jsonrpc !== "2.0") return;
	if (mensaje.method === undefined) {
		const pendiente = pendientes.get(mensaje.id);
		if (!pendiente) return;
		pendientes.delete(mensaje.id);
		if (mensaje.error) pendiente.mal(new Error(mensaje.error.message));
		else pendiente.ok(mensaje.result);
	} else if (mensaje.method === "ui/notifications/tool-result") mostrar(mensaje.params);
	else if (mensaje.method === "ui/notifications/host-context-changed") aplicarContexto(mensaje.params);
	else if (mensaje.method === "ui/resource-teardown" || mensaje.method === "ping") parent.postMessage({ jsonrpc: "2.0", id: mensaje.id, result: {} }, "*");
});

new ResizeObserver(() => avisar("ui/notifications/size-changed", {
	width: document.body.scrollWidth,
	height: document.body.scrollHeight,
})).observe(document.body);

enviar("ui/initialize", {
	protocolVersion: "2026-01-26",
	appInfo: { name: "cosmoflow", version: "1.0.0" },
	appCapabilities: {},
}).then((respuesta) => {
	aplicarContexto(respuesta?.hostContext);
	avisar("ui/notifications/initialized", {});
}, mostrarError);
`;

export function vistaHtml(vista: Vista): string {
	return `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Cosmoflow</title>
<style>${ESTILOS}</style>
</head>
<body>
<main id="app" aria-live="polite"><p class="suave">Cargando…</p></main>
<script>const VISTA = ${JSON.stringify(vista)};${SCRIPT}</script>
</body>
</html>`;
}
