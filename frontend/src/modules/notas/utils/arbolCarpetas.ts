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

type FilaExplorador<C, N> =
	| { tipo: "carpeta"; carpeta: C; nivel: number }
	| { tipo: "nota"; nota: N; nivel: number };

/**
 * Filas del explorador, como en Obsidian: en cada nivel, primero las subcarpetas y
 * luego las notas por título. Una nota de una carpeta desconocida va a la raíz.
 */
export function filasExplorador<
	C extends Carpetas[number],
	N extends { titulo: string; carpetaId: number | null },
>(
	carpetas: C[],
	notas: N[],
	plegadas: ReadonlySet<number> = new Set(),
): FilaExplorador<C, N>[] {
	const conocidas = new Set(carpetas.map((c) => c.id));
	const porCarpeta = new Map<number | null, N[]>();
	for (const nota of [...notas].sort((a, b) =>
		a.titulo.localeCompare(b.titulo, "es"),
	)) {
		const clave =
			nota.carpetaId !== null && conocidas.has(nota.carpetaId)
				? nota.carpetaId
				: null;
		porCarpeta.set(clave, [...(porCarpeta.get(clave) ?? []), nota]);
	}

	const salida: FilaExplorador<C, N>[] = [];
	const pendientes: { nivel: number; notas: N[] }[] = [];
	// Las notas de una carpeta salen cuando se acaban sus subcarpetas.
	const volcar = (desdeNivel: number) => {
		while ((pendientes.at(-1)?.nivel ?? -1) >= desdeNivel) {
			const { nivel, notas: grupo } =
				pendientes.pop() as (typeof pendientes)[0];
			for (const nota of grupo) salida.push({ tipo: "nota", nota, nivel });
		}
	};
	for (const { carpeta, nivel } of ordenEnArbol(carpetas, plegadas)) {
		volcar(nivel + 1);
		salida.push({ tipo: "carpeta", carpeta, nivel });
		if (!plegadas.has(carpeta.id))
			pendientes.push({
				nivel: nivel + 1,
				notas: porCarpeta.get(carpeta.id) ?? [],
			});
	}
	pendientes.unshift({ nivel: 0, notas: porCarpeta.get(null) ?? [] });
	volcar(0);
	return salida;
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
