// Posición fija junto al botón que abre un popover: anchor positioning
// aún no está en todos los navegadores.
// shortcut: no sigue al botón si la página se desplaza con el popover abierto; cerrarlo al hacer scroll si molesta.

/** En `beforetoggle`: bajo el ancla, alineado a su inicio o a su fin. */
export function colocarBajo(
	popover: HTMLElement,
	ancla: HTMLElement,
	alinear: "inicio" | "fin" = "inicio",
) {
	const r = ancla.getBoundingClientRect();
	popover.style.top = `${r.bottom + 4}px`;
	popover.style.left = alinear === "inicio" ? `${r.left}px` : "auto";
	popover.style.right =
		alinear === "fin"
			? `${document.documentElement.clientWidth - r.right}px`
			: "auto";
}

/** En `toggle` (ya pintado): lo mete en pantalla y, sin sitio debajo, lo abre encima. */
export function ajustarAPantalla(popover: HTMLElement, ancla: HTMLElement) {
	const caja = popover.getBoundingClientRect();
	const r = ancla.getBoundingClientRect();
	const ancho = document.documentElement.clientWidth;
	if (caja.right > ancho - 8) {
		popover.style.left = `${Math.max(8, ancho - caja.width - 8)}px`;
		popover.style.right = "auto";
	}
	if (caja.bottom > innerHeight - 8 && r.top > caja.height + 8) {
		popover.style.top = `${r.top - caja.height - 4}px`;
	}
}
