import type { EditorView } from "@milkdown/kit/prose/view";
import { type RefObject, useEffect, useRef, useState } from "react";
import { cn } from "@/core/utils/cn";
import {
	type ConsultaEditor,
	type Mencionable,
	pluginConsulta,
} from "./pluginMenciones";

interface MenuEditorOpciones {
	/** Sin él, no hay plugin ni menú. */
	activo: boolean;
	/** Qué abre el menú; el primer grupo es el texto por el que filtrar. */
	patron: RegExp;
	etiqueta: string;
	opciones: (texto: string) => Mencionable[];
	/** Lo escrito, o `null` con el menú cerrado (para pedir las opciones al servidor). */
	onTexto?: (texto: string | null) => void;
	insertar: (
		view: EditorView,
		consulta: ConsultaEditor,
		opcion: Mencionable,
	) => void;
}

/**
 * Autocompletado en el editor (`@`, `[[`): devuelve el plugin (o `null` si no está
 * activo) y el menú. Las teclas se capturan en `raiz` antes que ProseMirror, para
 * que Enter elija y no parta el párrafo.
 */
export function useMenuEditor(
	raiz: RefObject<HTMLElement | null>,
	{
		activo,
		patron,
		etiqueta,
		opciones: opcionesDe,
		onTexto,
		insertar,
	}: MenuEditorOpciones,
) {
	const [abierta, setAbierta] = useState<{
		consulta: ConsultaEditor;
		view: EditorView;
	} | null>(null);
	const [indice, setIndice] = useState(0);
	const opciones = abierta ? opcionesDe(abierta.consulta.texto) : [];
	const actual = useRef({ abierta, opciones, indice });
	actual.current = { abierta, opciones, indice };

	// El editor se crea una vez: el plugin también.
	const [plugin] = useState(() =>
		activo
			? pluginConsulta(patron, (consulta, view) => {
					setAbierta(consulta && { consulta, view });
					onTexto?.(consulta?.texto ?? null);
					setIndice(0);
				})
			: null,
	);

	const elegir = (opcion: Mencionable) => {
		const { abierta } = actual.current;
		if (abierta) insertar(abierta.view, abierta.consulta, opcion);
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
				aria-label={etiqueta}
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
