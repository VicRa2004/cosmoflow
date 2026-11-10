import type { CarpetaDto } from "../api/notasApi";

type Carpetas = Pick<CarpetaDto, "id" | "nombre" | "padreId">[];

/** Carpetas desde la raíz hasta la carpeta (incluida); `[]` en la raíz. */
export function cadenaDe<C extends Carpetas[number]>(
	carpetaId: number | null,
	carpetas: C[],
): C[] {
	const porId = new Map(carpetas.map((c) => [c.id, c]));
	const cadena: C[] = [];
	// El límite corta un ciclo imposible en datos sanos sin colgar la pestaña.
	for (let c = porId.get(carpetaId ?? -1); c && cadena.length < 100; ) {
		cadena.unshift(c);
		c = c.padreId === null ? undefined : porId.get(c.padreId);
	}
	return cadena;
}

/** Nombres desde la raíz hasta la carpeta (incluida); `[]` en la raíz. */
export const rutaDe = (carpetaId: number | null, carpetas: Carpetas) =>
	cadenaDe(carpetaId, carpetas).map((c) => c.nombre);

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
 * Lo que se ve al abrir una carpeta (`null`: la raíz): sus subcarpetas y sus notas,
 * por nombre. Una nota de una carpeta desconocida va a la raíz.
 */
export function contenidoDe<
	C extends Carpetas[number],
	N extends { titulo: string; carpetaId: number | null },
>(carpetaId: number | null, carpetas: C[], notas: N[]) {
	const conocidas = new Set(carpetas.map((c) => c.id));
	return {
		carpetas: carpetas
			.filter((c) => c.padreId === carpetaId)
			.sort((a, b) => a.nombre.localeCompare(b.nombre, "es")),
		notas: notas
			.filter(
				(n) =>
					(n.carpetaId !== null && conocidas.has(n.carpetaId)
						? n.carpetaId
						: null) === carpetaId,
			)
			.sort((a, b) => a.titulo.localeCompare(b.titulo, "es")),
	};
}

/** Recorrido en profundidad con su nivel, para un `<select>` con sangría. */
export function ordenEnArbol<T extends Carpetas[number]>(
	carpetas: T[],
): { carpeta: T; nivel: number }[] {
	const hijas = new Map<number | null, T[]>();
	for (const c of carpetas)
		hijas.set(c.padreId, [...(hijas.get(c.padreId) ?? []), c]);
	const salida: { carpeta: T; nivel: number }[] = [];
	const visitar = (padreId: number | null, nivel: number) => {
		for (const carpeta of hijas.get(padreId) ?? []) {
			salida.push({ carpeta, nivel });
			if (nivel < 50) visitar(carpeta.id, nivel + 1);
		}
	};
	visitar(null, 0);
	return salida;
}
