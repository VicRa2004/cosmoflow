import type { ReactNode } from "react";
import { cn } from "@/core/utils/cn";

/**
 * Texto para avisar de que una lista cargó solo los primeros `limite` elementos,
 * o `null` si está completa. Sin `total` (la API no lo da) basta con que se hayan
 * `cargados` tantos como el tope.
 */
export function textoListaRecortada({
	limite,
	total,
	cargados,
	nombre,
	femenino = false,
}: {
	limite: number;
	total?: number;
	cargados?: number;
	/** En plural: «tags», «tareas», «organizaciones». */
	nombre: string;
	/** Concordancia: «las primeras» (tareas) en lugar de «los primeros» (tags). */
	femenino?: boolean;
}): string | null {
	const primeros = femenino ? "las primeras" : "los primeros";
	if (total !== undefined) {
		return total > limite
			? `Mostrando ${primeros} ${limite} de ${total} ${nombre}.`
			: null;
	}
	return cargados !== undefined && cargados >= limite
		? `Mostrando ${primeros} ${limite} ${nombre}; puede haber más.`
		: null;
}

/** Nota bajo una lista recortada; no pinta nada si `aviso` es `null`. */
export function AvisoListaRecortada({
	aviso,
	children,
	className,
}: {
	aviso: string | null;
	/** Qué hacer para ver el resto. */
	children?: ReactNode;
	className?: string;
}) {
	if (!aviso) return null;
	return (
		<p className={cn("text-xs text-tinta-tenue", className)}>
			{aviso} {children}
		</p>
	);
}
