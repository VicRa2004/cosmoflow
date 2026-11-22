import { AtSign, SendHorizontal } from "lucide-react";
import {
	type KeyboardEvent,
	useEffect,
	useMemo,
	useRef,
	useState,
} from "react";
import { Avatar } from "@/core/components/ui/Avatar";
import { Button } from "@/core/components/ui/Button";
import { cn } from "@/core/utils/cn";
import type { TareaDto } from "../api/tareasApi";
import { useMiembrosDestino } from "../hooks/useMiembrosDestino";
import {
	deserializarParaEditor,
	detectarConsultaMencion,
	type MencionableComentario,
	serializarMenciones,
} from "../utils/mencionesComentario";

const MAX_CARACTERES = 10_000;

interface EditorComentarioProps {
	tarea: TareaDto;
	inicial?: string;
	textoEnviar: string;
	autoFocus?: boolean;
	onEnviar: (contenido: string) => Promise<unknown>;
	onCancelar?: () => void;
}

/**
 * Cuadro clásico de comentarios (sin Markdown WYSIWYG) con autocompletado `@`
 * para etiquetar miembros de la organización en tareas compartidas.
 */
export function EditorComentario(props: EditorComentarioProps) {
	const { organizacionId, equipoId, proyectoId } = props.tarea;
	return organizacionId === null ? (
		<EditorComentarioBase {...props} miembros={[]} />
	) : (
		<EditorComentarioCompartida
			{...props}
			organizacionId={organizacionId}
			equipoId={equipoId}
			proyectoId={proyectoId}
		/>
	);
}

function EditorComentarioCompartida({
	organizacionId,
	equipoId,
	proyectoId,
	...props
}: EditorComentarioProps & {
	organizacionId: number;
	equipoId?: number | null;
	proyectoId?: number | null;
}) {
	const miembros = useMiembrosDestino(organizacionId, equipoId, proyectoId);
	return <EditorComentarioBase {...props} miembros={miembros} />;
}

function EditorComentarioBase({
	inicial = "",
	textoEnviar,
	autoFocus = false,
	miembros,
	onEnviar,
	onCancelar,
}: EditorComentarioProps & { miembros: MencionableComentario[] }) {
	const estadoInicial = useMemo(
		() => deserializarParaEditor(inicial),
		[inicial],
	);
	const [texto, setTexto] = useState(estadoInicial.texto);
	const [menciones, setMenciones] = useState<Map<string, number>>(
		() => new Map(estadoInicial.menciones),
	);
	const [consultaMencion, setConsultaMencion] = useState<{
		inicio: number;
		consulta: string;
	} | null>(null);
	const [indiceActivo, setIndiceActivo] = useState(0);
	const [enviando, setEnviando] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const textareaRef = useRef<HTMLTextAreaElement>(null);

	const sugerencias = useMemo(() => {
		if (!consultaMencion || miembros.length === 0) return [];
		const q = consultaMencion.consulta.trim().toLowerCase();
		return miembros
			.filter(
				(m) =>
					q === "" ||
					m.nombre.toLowerCase().includes(q) ||
					(m.email?.toLowerCase().includes(q) ?? false),
			)
			.slice(0, 6);
	}, [consultaMencion, miembros]);

	const menuAbierto = consultaMencion !== null && sugerencias.length > 0;

	// Ajustar altura del textarea de forma fluida según el contenido.
	useEffect(() => {
		const el = textareaRef.current;
		if (!el) return;
		el.style.height = "auto";
		el.style.height = `${Math.min(el.scrollHeight, 224)}px`;
		void texto.length;
	}, [texto]);

	useEffect(() => {
		if (autoFocus) {
			const el = textareaRef.current;
			if (el) {
				el.focus();
				el.setSelectionRange(el.value.length, el.value.length);
			}
		}
	}, [autoFocus]);

	const actualizarMencionDesdeCursor = (valor: string, cursor: number) => {
		if (miembros.length === 0) {
			setConsultaMencion(null);
			return;
		}
		const detectada = detectarConsultaMencion(valor, cursor);
		setConsultaMencion(detectada);
		setIndiceActivo(0);
	};

	const insertarMencion = (miembro: MencionableComentario) => {
		const el = textareaRef.current;
		if (!consultaMencion) return;
		const cursor = el?.selectionStart ?? texto.length;
		const antes = texto.slice(0, consultaMencion.inicio);
		const despues = texto.slice(cursor);
		const insercion = `@${miembro.nombre} `;
		const nuevoTexto = `${antes}${insercion}${despues}`;
		const nuevoCursor = antes.length + insercion.length;

		setTexto(nuevoTexto);
		setMenciones((prev) => {
			const copia = new Map(prev);
			copia.set(miembro.nombre, miembro.id);
			return copia;
		});
		setConsultaMencion(null);
		setError(null);

		requestAnimationFrame(() => {
			if (!textareaRef.current) return;
			textareaRef.current.focus();
			textareaRef.current.setSelectionRange(nuevoCursor, nuevoCursor);
		});
	};

	const abrirSelectorMencion = () => {
		const el = textareaRef.current;
		if (!el) return;
		const pos = el.selectionStart ?? texto.length;
		const antes = texto.slice(0, pos);
		const despues = texto.slice(el.selectionEnd ?? pos);
		const necesitaEspacio = antes.length > 0 && !/[\s([{"'¿¡]$/.test(antes);
		const insercion = necesitaEspacio ? " @" : "@";
		const nuevoTexto = `${antes}${insercion}${despues}`;
		const nuevoCursor = antes.length + insercion.length;

		setTexto(nuevoTexto);
		setConsultaMencion({ inicio: nuevoCursor - 1, consulta: "" });
		setIndiceActivo(0);
		requestAnimationFrame(() => {
			el.focus();
			el.setSelectionRange(nuevoCursor, nuevoCursor);
		});
	};

	const enviar = async () => {
		const limpio = texto.trim();
		if (!limpio) {
			setError("Escribe algo antes de enviar");
			return;
		}
		const serializado = serializarMenciones(limpio, menciones, miembros);
		if (serializado.length > MAX_CARACTERES) {
			setError("Máximo 10.000 caracteres");
			return;
		}
		setError(null);
		setEnviando(true);
		try {
			await onEnviar(serializado);
			if (!onCancelar) {
				setTexto("");
				setMenciones(new Map());
				setConsultaMencion(null);
			}
		} finally {
			setEnviando(false);
		}
	};

	const manejarTecla = (e: KeyboardEvent<HTMLTextAreaElement>) => {
		if (menuAbierto) {
			if (e.key === "ArrowDown") {
				e.preventDefault();
				setIndiceActivo((i) => (i + 1) % sugerencias.length);
				return;
			}
			if (e.key === "ArrowUp") {
				e.preventDefault();
				setIndiceActivo(
					(i) => (i - 1 + sugerencias.length) % sugerencias.length,
				);
				return;
			}
			if (e.key === "Enter" || e.key === "Tab") {
				e.preventDefault();
				const elegido = sugerencias[indiceActivo];
				if (elegido) insertarMencion(elegido);
				return;
			}
			if (e.key === "Escape") {
				e.preventDefault();
				setConsultaMencion(null);
				return;
			}
		}

		if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
			e.preventDefault();
			if (!enviando && texto.trim().length > 0) {
				void enviar();
			}
		} else if (e.key === "Escape" && onCancelar) {
			e.preventDefault();
			onCancelar();
		}
	};

	const placeholder =
		miembros.length > 0
			? "Escribe un comentario… Usa @ para etiquetar a alguien"
			: "Escribe un comentario…";

	return (
		<div className="relative space-y-1.5">
			{menuAbierto && (
				<div
					role="listbox"
					aria-label="Etiquetar miembro"
					className="absolute bottom-full left-0 z-30 mb-1.5 w-full max-w-xs overflow-hidden rounded-lg border border-borde bg-superficie py-1 shadow-flotante"
				>
					<p className="px-3 py-1 text-[11px] font-medium uppercase tracking-wide text-tinta-tenue">
						Etiquetar persona
					</p>
					{sugerencias.map((miembro, idx) => {
						const activo = idx === indiceActivo;
						return (
							<button
								key={miembro.id}
								type="button"
								role="option"
								aria-selected={activo}
								onMouseDown={(e) => {
									e.preventDefault();
									insertarMencion(miembro);
								}}
								onMouseEnter={() => setIndiceActivo(idx)}
								className={cn(
									"flex w-full items-center gap-2.5 px-3 py-1.5 text-left text-sm transition-colors",
									activo
										? "bg-elevada text-tinta"
										: "text-tinta-suave hover:bg-elevada/60",
								)}
							>
								<Avatar
									nombre={miembro.nombre}
									className="size-6 text-[11px]"
								/>
								<span className="min-w-0 flex-1">
									<span className="block truncate font-medium text-tinta">
										{miembro.nombre}
									</span>
									{miembro.email && (
										<span className="block truncate text-xs text-tinta-tenue">
											{miembro.email}
										</span>
									)}
								</span>
							</button>
						);
					})}
				</div>
			)}

			<div
				className={cn(
					"rounded-lg border bg-superficie transition-colors",
					error
						? "border-rose-500/70"
						: "border-borde focus-within:border-indigo-500/70 focus-within:ring-2 focus-within:ring-indigo-500/15",
				)}
			>
				<textarea
					ref={textareaRef}
					value={texto}
					rows={2}
					maxLength={MAX_CARACTERES}
					disabled={enviando}
					placeholder={placeholder}
					aria-label="Comentario"
					onChange={(e) => {
						const valor = e.target.value;
						setTexto(valor);
						if (error) setError(null);
						actualizarMencionDesdeCursor(valor, e.target.selectionStart);
					}}
					onClick={(e) =>
						actualizarMencionDesdeCursor(
							e.currentTarget.value,
							e.currentTarget.selectionStart,
						)
					}
					onKeyUp={(e) => {
						if (
							e.key === "ArrowLeft" ||
							e.key === "ArrowRight" ||
							e.key === "Home" ||
							e.key === "End"
						) {
							actualizarMencionDesdeCursor(
								e.currentTarget.value,
								e.currentTarget.selectionStart,
							);
						}
					}}
					onKeyDown={manejarTecla}
					onBlur={() => {
						// Dejar un instante para permitir el clic sobre una opción del menú.
						setTimeout(() => setConsultaMencion(null), 120);
					}}
					className="block max-h-56 min-h-[72px] w-full resize-none bg-transparent px-3.5 pt-3 pb-2 text-sm leading-relaxed text-tinta placeholder:text-tinta-tenue focus:outline-none disabled:opacity-60"
				/>

				<div className="flex flex-wrap items-center justify-between gap-2 rounded-b-lg border-t border-borde/70 bg-elevada/30 px-2.5 py-2">
					<div className="flex items-center gap-2">
						{miembros.length > 0 && (
							<Button
								type="button"
								variant="ghost"
								size="sm"
								disabled={enviando}
								onClick={abrirSelectorMencion}
								className="h-7 px-2 text-xs text-tinta-suave hover:text-tinta"
							>
								<AtSign className="h-3.5 w-3.5" />
								Etiquetar
							</Button>
						)}
						<span className="hidden text-xs text-tinta-tenue sm:inline">
							Ctrl+Enter para enviar
						</span>
					</div>

					<div className="flex items-center gap-2">
						{texto.length > 8_000 && (
							<span className="text-xs text-tinta-tenue">
								{texto.length}/{MAX_CARACTERES}
							</span>
						)}
						{onCancelar && (
							<Button
								type="button"
								variant="ghost"
								size="sm"
								disabled={enviando}
								onClick={onCancelar}
							>
								Cancelar
							</Button>
						)}
						<Button
							type="button"
							size="sm"
							isLoading={enviando}
							disabled={texto.trim().length === 0}
							onClick={() => void enviar()}
						>
							{!onCancelar && <SendHorizontal className="h-3.5 w-3.5" />}
							{textoEnviar}
						</Button>
					</div>
				</div>
			</div>

			{error && (
				<p role="alert" className="text-xs text-rose-400">
					{error}
				</p>
			)}
		</div>
	);
}
