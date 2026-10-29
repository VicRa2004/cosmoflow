// Reglas de nombres en español que comparten los generadores de módulos
// (backend/scripts/gen-module.ts y scripts/gen-module-web.ts).

// Masculinos en -a habituales en un dominio de software.
const MASCULINOS_EN_A = new Set([
	"dia",
	"mapa",
	"tema",
	"problema",
	"sistema",
	"programa",
	"idioma",
	"esquema",
	"clima",
]);

/** vocal → +s · -z → -ces · l, n, r, d, j, y → +es · resto (préstamos: tag, chat) → +s. */
export function plural(s: string): string {
	if (/[aeiou]$/i.test(s)) return `${s}s`;
	if (/z$/i.test(s)) return `${s.slice(0, -1)}ces`;
	if (/[lnrdjy]$/i.test(s)) return `${s}es`;
	return `${s}s`;
}

/**
 * Género por la última palabra del camelCase (ordenCompra → compra).
 * shortcut: heurística por terminación; forzar con --femenino / --masculino si falla.
 */
export function esFemenino(nombre: string, args: string[] = []): boolean {
	if (args.includes("--femenino")) return true;
	if (args.includes("--masculino")) return false;
	const ultima = (
		nombre.match(/[A-Z]?[a-z0-9]+$/)?.[0] ?? nombre
	).toLowerCase();
	if (MASCULINOS_EN_A.has(ultima)) return false;
	return /(a|ion|dad|tad|tud|umbre)$/.test(ultima);
}

/** Concordancia de participios y adjetivos en -o: "creado" → "creada". */
export const concordar = (texto: string, femenino: boolean) =>
	femenino ? texto.replace(/(\w{2,})o\b/g, "$1a") : texto;
