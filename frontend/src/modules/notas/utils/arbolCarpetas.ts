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

/** Criterio del explorador (preferencia `ordenNotas`): las fechas, de la más reciente a la más antigua. */
export type OrdenNotas = "nombre" | "creada" | "modificada";

interface Fechado {
	createdAt?: string;
	updatedAt?: string;
}

const CAMPO_FECHA: Record<OrdenNotas, keyof Fechado | null> = {
	nombre: null,
	creada: "createdAt",
	modificada: "updatedAt",
};

/** Por la fecha del criterio y, a igualdad (o por nombre), alfabético. */
const comparador =
	<T extends Fechado>(orden: OrdenNotas, nombre: (x: T) => string) =>
	(a: T, b: T) => {
		const campo = CAMPO_FECHA[orden];
		// ISO 8601: el orden de texto es el cronológico.
		const porFecha = campo ? (b[campo] ?? "").localeCompare(a[campo] ?? "") : 0;
		return porFecha || nombre(a).localeCompare(nombre(b), "es");
	};

/** Notas en el orden del explorador: las fijadas primero. */
export function ordenarNotas<
	N extends Fechado & { titulo: string; isFijada?: boolean },
>(notas: N[], orden: OrdenNotas = "nombre"): N[] {
	const porCriterio = comparador<N>(orden, (n) => n.titulo);
	return [...notas].sort(
		(a, b) =>
			Number(Boolean(b.isFijada)) - Number(Boolean(a.isFijada)) ||
			porCriterio(a, b),
	);
}

/**
 * Lo que se ve al abrir una carpeta (`null`: la raíz): sus subcarpetas y sus notas,
 * en el orden elegido. Una nota de una carpeta desconocida va a la raíz.
 */
export function contenidoDe<
	C extends Carpetas[number] & Fechado,
	N extends Fechado & {
		titulo: string;
		carpetaId: number | null;
		isFijada?: boolean;
	},
>(
	carpetaId: number | null,
	carpetas: C[],
	notas: N[],
	orden: OrdenNotas = "nombre",
) {
	const conocidas = new Set(carpetas.map((c) => c.id));
	return {
		carpetas: carpetas
			.filter((c) => c.padreId === carpetaId)
			.sort(comparador<C>(orden, (c) => c.nombre)),
		notas: ordenarNotas(
			notas.filter(
				(n) =>
					(n.carpetaId !== null && conocidas.has(n.carpetaId)
						? n.carpetaId
						: null) === carpetaId,
			),
			orden,
		),
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
