import type { PreferenciasInterfaz } from "./api/preferenciasApi";

const CLAVE = "preferencias-interfaz";

/** `data-*` en <html> (`index.css` los traduce a variables) y copia local para el próximo arranque. */
export function aplicarPreferencias(p: Partial<PreferenciasInterfaz>) {
	const html = document.documentElement.dataset;
	html.uiTamano = p.tamanoInterfaz;
	html.mdFuente = p.markdownFuente;
	html.mdTamano = p.markdownTamano;
	html.mdInterlineado = p.markdownInterlineado;
	html.mdColor = p.markdownColor;
	try {
		localStorage.setItem(CLAVE, JSON.stringify(p));
	} catch {
		// sin copia local: se pinta con las predeterminadas hasta que responda el servidor
	}
}

/** Al arrancar, las últimas de este navegador: evita el parpadeo hasta que llegan las del servidor. */
export function aplicarPreferenciasGuardadas() {
	try {
		const guardadas = localStorage.getItem(CLAVE);
		if (guardadas) aplicarPreferencias(JSON.parse(guardadas));
	} catch {
		// copia ilegible o bloqueada: se ignora
	}
}
