import type { CarpetaDto } from "../api/notasApi";

type Carpetas = Pick<CarpetaDto, "id" | "nombre" | "padreId">[];

/** Nombres desde la raíz hasta la carpeta (incluida); `[]` en la raíz. */
export function rutaDe(carpetaId: number | null, carpetas: Carpetas): string[] {
	const porId = new Map(carpetas.map((c) => [c.id, c]));
	const ruta: string[] = [];
	// El límite corta un ciclo imposible en datos sanos sin colgar la pestaña.
	for (let c = porId.get(carpetaId ?? -1); c && ruta.length < 100; ) {
		ruta.unshift(c.nombre);
		c = c.padreId === null ? undefined : porId.get(c.padreId);
	}
	return ruta;
}

/** La carpeta y todas las que cuelgan de ella. */
export function subarbol(carpetaId: number, carpetas: Carpetas): Set<number> {
	const ids = new Set([carpetaId]);
	let creciendo = true;
	while (creciendo) {
		creciendo = false;
		for (const c of carpetas) {
			if (c.padreId !== null && ids.has(c.padreId) && !ids.has(c.id)) {
				ids.add(c.id);
				creciendo = true;
			}
		}
	}
	return ids;
}

/**
 * Recorrido en profundidad con su nivel, para pintar el árbol o un `<select>`
 * con sangría. No baja por las `plegadas`.
 */
export function ordenEnArbol<T extends Carpetas[number]>(
	carpetas: T[],
	plegadas: ReadonlySet<number> = new Set(),
): { carpeta: T; nivel: number }[] {
	const hijas = new Map<number | null, T[]>();
	for (const c of carpetas)
		hijas.set(c.padreId, [...(hijas.get(c.padreId) ?? []), c]);
	const salida: { carpeta: T; nivel: number }[] = [];
	const visitar = (padreId: number | null, nivel: number) => {
		for (const carpeta of hijas.get(padreId) ?? []) {
			salida.push({ carpeta, nivel });
			if (!plegadas.has(carpeta.id) && nivel < 50)
				visitar(carpeta.id, nivel + 1);
		}
	};
	visitar(null, 0);
	return salida;
}
