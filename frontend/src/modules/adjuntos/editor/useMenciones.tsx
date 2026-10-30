import type { EditorView } from "@milkdown/kit/prose/view";
import { type RefObject, useEffect, useRef, useState } from "react";
import { cn } from "@/core/utils/cn";
import {
	type ConsultaMencion,
	filtrarMencionables,
	insertarMencion,
	type Mencionable,
	pluginMenciones,
} from "./pluginMenciones";

/**
 * Autocompletado de `@` en el editor: devuelve el plugin (o `null` si no hay a quién
 * mencionar) y el menú. Las teclas se capturan en `raiz` antes que ProseMirror, para
 * que Enter elija y no parta el párrafo.
 */
export function useMenciones(
	raiz: RefObject<HTMLElement | null>,
	mencionables: Mencionable[] | undefined,
) {
	const [abierta, setAbierta] = useState<{
		consulta: ConsultaMencion;
		view: EditorView;
	} | null>(null);
	const [indice, setIndice] = useState(0);
	const opciones =
		abierta && mencionables
			? filtrarMencionables(mencionables, abierta.consulta.texto)
			: [];
	const actual = useRef({ abierta, opciones, indice });
	actual.current = { abierta, opciones, indice };

	// El editor se crea una vez: el plugin también.
	const [plugin] = useState(() =>
		mencionables
			? pluginMenciones((consulta, view) => {
					setAbierta(consulta && { consulta, view });
					setIndice(0);
				})
			: null,
	);

	const elegir = (mencionable: Mencionable) => {
		const { abierta } = actual.current;
		if (abierta) insertarMencion(abierta.view, abierta.consulta, mencionable);
		setAbierta(null);
	};
	const elegirRef = useRef(elegir);
	elegirRef.current = elegir;

	useEffect(() => {
		const elemento = raiz.current;
		if (!elemento || !plugin) return;
		const onTecla = (evento: KeyboardEvent) => {
			const { opciones, indice } = actual.current;
			if (opciones.length === 0) return;
			const total = opciones.length;
			if (evento.key === "ArrowDown") setIndice((indice + 1) % total);
			else if (evento.key === "ArrowUp")
				setIndice((indice - 1 + total) % total);
			else if (evento.key === "Enter" || evento.key === "Tab")
				elegirRef.current(opciones[indice]);
			else if (evento.key === "Escape") setAbierta(null);
			else return;
			evento.preventDefault();
			evento.stopPropagation();
		};
		elemento.addEventListener("keydown", onTecla, true);
		return () => elemento.removeEventListener("keydown", onTecla, true);
	}, [raiz, plugin]);

	const menu =
		abierta && opciones.length > 0 ? (
			<div
				role="listbox"
				aria-label="Mencionar a"
				style={{ left: abierta.consulta.x, top: abierta.consulta.y + 4 }}
				className="fixed z-50 min-w-48 overflow-hidden rounded-md border border-borde bg-superficie py-1 shadow-flotante"
			>
				{opciones.map((opcion, i) => (
					<div
						key={opcion.id}
						role="option"
						// El foco se queda en el editor, que lleva el teclado (flechas, Enter, Esc).
						tabIndex={-1}
						aria-selected={i === indice}
						// mousedown + preventDefault: el editor no pierde el foco y la consulta sigue viva.
						onMouseDown={(evento) => {
							evento.preventDefault();
							elegir(opcion);
						}}
						onMouseEnter={() => setIndice(i)}
						className={cn(
							"cursor-pointer px-3 py-1.5 text-sm text-tinta",
							i === indice && "bg-elevada",
						)}
					>
						{opcion.nombre}
					</div>
				))}
			</div>
		) : null;

	return { plugin, menu };
}
