import { Check, ChevronsUpDown, Plus } from "lucide-react";
import {
	type ReactNode,
	type ToggleEvent,
	useId,
	useRef,
	useState,
} from "react";
import { cn } from "@/core/utils/cn";
import { normalizar } from "@/core/utils/normalizar";
import { ajustarAPantalla, colocarBajo } from "./popoverAnclado";

export interface OpcionCombobox<T extends string | number> {
	id: T;
	etiqueta: string;
	/** Icono, punto de color o avatar antes de la etiqueta. */
	icono?: ReactNode;
}

interface ComboboxBaseProps<T extends string | number> {
	opciones: OpcionCombobox<T>[];
	/** Etiqueta visible encima del botón; también nombra el buscador. */
	label: string;
	/** Contenido del botón que abre la lista (el valor actual). */
	children: ReactNode;
	vacio?: string;
	/** Con él, si lo buscado no existe, ofrece «Crear «texto»» al final. */
	onCrear?: (texto: string) => void;
	className?: string;
}

type ComboboxProps<T extends string | number> = ComboboxBaseProps<T> &
	(
		| { multiple: true; valor: T[]; onChange: (valor: T[]) => void }
		| { multiple?: false; valor: T | null; onChange: (valor: T) => void }
	);

export const filtrarOpciones = <T extends string | number>(
	opciones: OpcionCombobox<T>[],
	texto: string,
) => {
	const filtro = normalizar(texto.trim());
	return opciones.filter((o) => normalizar(o.etiqueta).includes(filtro));
};

/** Hay texto y ninguna opción se llama exactamente así (sin mirar mayúsculas ni acentos). */
export const sePuedeCrear = <T extends string | number>(
	opciones: OpcionCombobox<T>[],
	texto: string,
) => {
	const buscado = normalizar(texto.trim());
	return (
		buscado !== "" && !opciones.some((o) => normalizar(o.etiqueta) === buscado)
	);
};

export const alternar = <T,>(valor: T[], id: T) =>
	valor.includes(id) ? valor.filter((v) => v !== id) : [...valor, id];

/** Botón que abre una lista con buscador (popover nativo: Esc y clic fuera la cierran). */
export function Combobox<T extends string | number>(props: ComboboxProps<T>) {
	const {
		opciones,
		label,
		children,
		vacio = "Sin resultados",
		onCrear,
		className,
	} = props;
	const [texto, setTexto] = useState("");
	const [activo, setActivo] = useState(0);
	const id = useId();
	const boton = useRef<HTMLButtonElement>(null);
	const lista = useRef<HTMLDivElement>(null);
	const buscador = useRef<HTMLInputElement>(null);

	const seleccionados: T[] = props.multiple
		? props.valor
		: props.valor === null
			? []
			: [props.valor];
	const visibles = filtrarOpciones(opciones, texto);
	const conCrear = onCrear !== undefined && sePuedeCrear(opciones, texto);
	// «Crear…» va detrás de las opciones y se recorre con las flechas como una más.
	const total = visibles.length + (conCrear ? 1 : 0);
	const indice = Math.min(activo, total - 1);
	const idOpcion = (o: OpcionCombobox<T>) => `${id}-op-${o.id}`;
	const idCrear = `${id}-crear`;

	// Sin opción en `indice`, la activa es «Crear…» (si la hay).
	let idActivo: string | undefined;
	if (visibles[indice]) idActivo = idOpcion(visibles[indice]);
	else if (conCrear) idActivo = idCrear;

	const crear = () => {
		onCrear?.(texto.trim());
		setTexto("");
		setActivo(0);
	};

	const elegir = (opcion: OpcionCombobox<T> | undefined) => {
		if (!opcion) return;
		if (props.multiple) props.onChange(alternar(props.valor, opcion.id));
		else {
			props.onChange(opcion.id);
			lista.current?.hidePopover();
		}
	};

	const alPrepararApertura = (e: ToggleEvent<HTMLDivElement>) => {
		if (e.newState !== "open" || !boton.current) return;
		colocarBajo(e.currentTarget, boton.current);
		setTexto("");
		setActivo(0);
	};

	const alAbrir = (e: ToggleEvent<HTMLDivElement>) => {
		if (e.newState !== "open" || !boton.current) return;
		ajustarAPantalla(e.currentTarget, boton.current);
		buscador.current?.focus();
	};

	return (
		<div className={cn("space-y-1.5", className)}>
			<span
				id={`${id}-label`}
				className="block text-[13px] font-medium text-tinta-suave"
			>
				{label}
			</span>
			<button
				ref={boton}
				id={`${id}-boton`}
				type="button"
				popoverTarget={`${id}-lista`}
				aria-haspopup="listbox"
				aria-labelledby={`${id}-label ${id}-boton`}
				className="flex min-h-9 w-full cursor-pointer items-center gap-2 rounded-md border border-borde bg-superficie px-2.5 text-left text-sm text-tinta transition-colors hover:bg-elevada"
			>
				<span className="flex min-w-0 flex-1 items-center gap-2">
					{children}
				</span>
				<ChevronsUpDown
					aria-hidden
					className="size-4 shrink-0 text-tinta-tenue"
				/>
			</button>
			<div
				ref={lista}
				id={`${id}-lista`}
				popover="auto"
				onBeforeToggle={alPrepararApertura}
				onToggle={alAbrir}
				className="inset-auto m-0 w-64 rounded-lg border border-borde bg-superficie p-1.5 text-tinta shadow-flotante"
			>
				<input
					ref={buscador}
					role="combobox"
					aria-label={`Buscar ${label.toLowerCase()}`}
					aria-expanded
					aria-controls={`${id}-opciones`}
					aria-activedescendant={idActivo}
					placeholder="Buscar…"
					value={texto}
					onChange={(e) => {
						setTexto(e.target.value);
						setActivo(0);
					}}
					onKeyDown={(e) => {
						if ((e.key === "ArrowDown" || e.key === "ArrowUp") && total > 0) {
							e.preventDefault();
							const paso = e.key === "ArrowDown" ? 1 : -1;
							setActivo((indice + paso + total) % total);
						} else if (e.key === "Enter") {
							e.preventDefault();
							if (visibles[indice]) elegir(visibles[indice]);
							else if (conCrear) crear();
						}
					}}
					className="mb-1 h-8 w-full rounded-md bg-transparent px-2 text-sm text-tinta outline-none placeholder:text-tinta-tenue"
				/>
				<div
					id={`${id}-opciones`}
					role="listbox"
					aria-label={label}
					aria-multiselectable={props.multiple}
					className="max-h-64 overflow-y-auto border-t border-borde pt-1"
				>
					{visibles.map((opcion, i) => {
						const marcada = seleccionados.includes(opcion.id);
						return (
							// biome-ignore lint/a11y/useKeyWithClickEvents: el teclado se maneja desde el buscador (combobox)
							<div
								key={opcion.id}
								id={idOpcion(opcion)}
								tabIndex={-1}
								role="option"
								aria-selected={marcada}
								// Sin robar el foco al buscador, que lleva el teclado.
								onMouseDown={(e) => e.preventDefault()}
								onClick={() => elegir(opcion)}
								onMouseMove={() => setActivo(i)}
								className={cn(
									"flex h-9 cursor-pointer items-center gap-2 rounded-md px-2 text-sm text-tinta-suave",
									i === indice && "bg-elevada text-tinta",
								)}
							>
								{opcion.icono}
								<span className="flex-1 truncate">{opcion.etiqueta}</span>
								{marcada && (
									<Check aria-hidden className="size-4 text-indigo-400" />
								)}
							</div>
						);
					})}
					{conCrear && (
						// biome-ignore lint/a11y/useKeyWithClickEvents: el teclado se maneja desde el buscador (combobox)
						<div
							id={idCrear}
							tabIndex={-1}
							role="option"
							aria-selected={false}
							onMouseDown={(e) => e.preventDefault()}
							onClick={crear}
							onMouseMove={() => setActivo(visibles.length)}
							className={cn(
								"flex h-9 cursor-pointer items-center gap-2 rounded-md px-2 text-sm text-tinta-suave",
								indice === visibles.length && "bg-elevada text-tinta",
							)}
						>
							<Plus aria-hidden className="size-4 shrink-0 text-indigo-400" />
							<span className="truncate">Crear «{texto.trim()}»</span>
						</div>
					)}
					{total === 0 && (
						<p className="px-2 py-4 text-center text-sm text-tinta-tenue">
							{vacio}
						</p>
					)}
				</div>
			</div>
		</div>
	);
}
