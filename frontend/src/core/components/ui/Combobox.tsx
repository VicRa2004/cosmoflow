import { Check } from "lucide-react";
import {
	type ReactNode,
	type ToggleEvent,
	useId,
	useRef,
	useState,
} from "react";
import { cn } from "@/core/utils/cn";
import { normalizar } from "@/core/utils/normalizar";

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

export const alternar = <T,>(valor: T[], id: T) =>
	valor.includes(id) ? valor.filter((v) => v !== id) : [...valor, id];

const ANCHO_LISTA = 256; // w-64

/** Botón que abre una lista con buscador (popover nativo: Esc y clic fuera la cierran). */
export function Combobox<T extends string | number>(props: ComboboxProps<T>) {
	const {
		opciones,
		label,
		children,
		vacio = "Sin resultados",
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
	const indice = Math.min(activo, visibles.length - 1);
	const idOpcion = (o: OpcionCombobox<T>) => `${id}-op-${o.id}`;

	const elegir = (opcion: OpcionCombobox<T> | undefined) => {
		if (!opcion) return;
		if (props.multiple) props.onChange(alternar(props.valor, opcion.id));
		else {
			props.onChange(opcion.id);
			lista.current?.hidePopover();
		}
	};

	// Posición fija bajo el botón: anchor positioning aún no está en todos los navegadores.
	const alPrepararApertura = (e: ToggleEvent<HTMLDivElement>) => {
		if (e.newState !== "open" || !boton.current) return;
		const r = boton.current.getBoundingClientRect();
		e.currentTarget.style.top = `${r.bottom + 4}px`;
		e.currentTarget.style.left = `${Math.max(8, Math.min(r.left, innerWidth - ANCHO_LISTA - 8))}px`;
		setTexto("");
		setActivo(0);
	};

	const alAbrir = (e: ToggleEvent<HTMLDivElement>) => {
		if (e.newState !== "open") return;
		const caja = e.currentTarget.getBoundingClientRect();
		const r = boton.current?.getBoundingClientRect();
		// Sin sitio debajo: se abre encima del botón.
		if (r && caja.bottom > innerHeight - 8 && r.top > caja.height + 8)
			e.currentTarget.style.top = `${r.top - caja.height - 4}px`;
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
				className="inline-flex min-h-9 max-w-full cursor-pointer items-center gap-2 rounded-md border border-borde bg-superficie px-2.5 text-sm text-tinta transition-colors hover:bg-elevada"
			>
				{children}
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
					aria-activedescendant={
						visibles[indice] ? idOpcion(visibles[indice]) : undefined
					}
					placeholder="Buscar…"
					value={texto}
					onChange={(e) => {
						setTexto(e.target.value);
						setActivo(0);
					}}
					onKeyDown={(e) => {
						if (
							(e.key === "ArrowDown" || e.key === "ArrowUp") &&
							visibles.length > 0
						) {
							e.preventDefault();
							const paso = e.key === "ArrowDown" ? 1 : -1;
							setActivo((indice + paso + visibles.length) % visibles.length);
						} else if (e.key === "Enter") {
							e.preventDefault();
							elegir(visibles[indice]);
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
					{visibles.length === 0 && (
						<p className="px-2 py-4 text-center text-sm text-tinta-tenue">
							{vacio}
						</p>
					)}
				</div>
			</div>
		</div>
	);
}
