import {
	MessageSquare,
	MessageSquareReply,
	Pencil,
	Trash2,
} from "lucide-react";
import { useMemo, useState } from "react";
import { useAuthStore } from "@/core/auth/store";
import { Avatar } from "@/core/components/ui/Avatar";
import { Button } from "@/core/components/ui/Button";
import { ConfirmDialog } from "@/core/components/ui/ConfirmDialog";
import { Spinner } from "@/core/components/ui/Spinner";
import type { ComentarioTareaDto } from "../api/comentariosApi";
import type { TareaDto } from "../api/tareasApi";
import {
	useComentariosMutation,
	useComentariosQuery,
} from "../hooks/useComentarios";
import { parsearMencionesTexto } from "../utils/mencionesComentario";
import { EditorComentario } from "./EditorComentario";

const fecha = (iso: string) =>
	new Date(iso).toLocaleString(undefined, {
		dateStyle: "medium",
		timeStyle: "short",
	});

/** Agrupa la conversación plana en comentarios raíz y sus respuestas (hilos de 1 nivel). */
export function agruparHilos(comentarios: ComentarioTareaDto[]): {
	raices: ComentarioTareaDto[];
	respuestasPorPadre: Map<number, ComentarioTareaDto[]>;
} {
	const ids = new Set(comentarios.map((c) => c.id));
	const raices: ComentarioTareaDto[] = [];
	const respuestasPorPadre = new Map<number, ComentarioTareaDto[]>();

	for (const comentario of comentarios) {
		if (comentario.padreId !== null && ids.has(comentario.padreId)) {
			const lista = respuestasPorPadre.get(comentario.padreId) ?? [];
			lista.push(comentario);
			respuestasPorPadre.set(comentario.padreId, lista);
		} else {
			raices.push(comentario);
		}
	}
	return { raices, respuestasPorPadre };
}

/** Texto plano con saltos de línea y menciones `[@Nombre](mencion:ID)` resaltadas. */
function TextoComentario({ contenido }: { contenido: string }) {
	const segmentos = parsearMencionesTexto(contenido);
	return (
		<p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-tinta-suave">
			{segmentos.map((segmento) =>
				segmento.tipo === "mencion" ? (
					<span
						key={`mencion-${segmento.inicio}`}
						className="inline-flex items-center rounded bg-indigo-950/70 px-1.5 py-0.5 text-xs font-medium text-indigo-300"
					>
						@{segmento.nombre}
					</span>
				) : (
					<span key={`texto-${segmento.inicio}`}>{segmento.valor}</span>
				),
			)}
		</p>
	);
}

function Comentario({
	tarea,
	comentario,
	esRespuesta = false,
	onResponder,
	onEliminar,
}: {
	tarea: TareaDto;
	comentario: ComentarioTareaDto;
	esRespuesta?: boolean;
	onResponder: (c: ComentarioTareaDto) => void;
	onEliminar: (c: ComentarioTareaDto) => void;
}) {
	const yo = useAuthStore((state) => state.usuario?.id);
	const { actualizar } = useComentariosMutation(tarea.id);
	const [editando, setEditando] = useState(false);
	const propio = comentario.autorId === yo;

	return (
		<div className="group/comentario flex gap-3">
			<Avatar
				nombre={comentario.autorNombre}
				url={comentario.autorAvatarUrl}
				className={
					esRespuesta ? "mt-0.5 size-6 shrink-0" : "mt-0.5 size-8 shrink-0"
				}
			/>
			<div className="min-w-0 flex-1 space-y-1.5">
				<div className="flex items-center justify-between gap-2">
					<p className="truncate text-sm">
						<span className="font-medium text-tinta">
							{comentario.autorNombre}
						</span>{" "}
						<span className="text-xs text-tinta-tenue">
							· {fecha(comentario.createdAt)}
							{comentario.editadoEn && " (editado)"}
						</span>
					</p>
					{!editando && (
						<div className="flex shrink-0 gap-1 opacity-0 transition-opacity group-focus-within/comentario:opacity-100 group-hover/comentario:opacity-100 [@media(hover:none)]:opacity-100">
							<Button
								variant="ghost"
								size="sm"
								onClick={() => onResponder(comentario)}
								aria-label={`Responder a ${comentario.autorNombre}`}
								className="h-7 px-2"
							>
								<MessageSquareReply className="h-3.5 w-3.5" />
							</Button>
							{propio && (
								<>
									<Button
										variant="ghost"
										size="sm"
										onClick={() => setEditando(true)}
										aria-label="Editar comentario"
										className="h-7 px-2"
									>
										<Pencil className="h-3.5 w-3.5" />
									</Button>
									<Button
										variant="dangerGhost"
										size="sm"
										onClick={() => onEliminar(comentario)}
										aria-label="Eliminar comentario"
										className="h-7 px-2"
									>
										<Trash2 className="h-3.5 w-3.5" />
									</Button>
								</>
							)}
						</div>
					)}
				</div>
				{editando ? (
					<EditorComentario
						tarea={tarea}
						inicial={comentario.contenido}
						textoEnviar="Guardar"
						autoFocus
						onCancelar={() => setEditando(false)}
						onEnviar={(contenido) =>
							actualizar.mutateAsync(
								{ id: comentario.id, contenido },
								{ onSuccess: () => setEditando(false) },
							)
						}
					/>
				) : (
					<TextoComentario contenido={comentario.contenido} />
				)}
			</div>
		</div>
	);
}

/** Conversación clásica de una tarea en hilos de 1 nivel, con menciones `@` en las compartidas. */
export function ComentariosTarea({ tarea }: { tarea: TareaDto }) {
	const usuario = useAuthStore((state) => state.usuario);
	const { data, isLoading } = useComentariosQuery(tarea.id);
	const { crear, eliminar } = useComentariosMutation(tarea.id);
	const [aEliminar, setAEliminar] = useState<ComentarioTareaDto | null>(null);
	const [respondiendoA, setRespondiendoA] = useState<{
		hiloId: number;
		inicial: string;
	} | null>(null);
	const comentarios = data?.datos ?? [];
	const { raices, respuestasPorPadre } = useMemo(
		() => agruparHilos(comentarios),
		[comentarios],
	);

	const abrirRespuesta = (hiloId: number, objetivo: ComentarioTareaDto) => {
		// En compartidas, responder a otra persona dentro del hilo la deja etiquetada.
		const etiquetar =
			tarea.organizacionId !== null &&
			objetivo.padreId !== null &&
			objetivo.autorId !== usuario?.id;
		const inicial = etiquetar
			? `[@${objetivo.autorNombre}](mencion:${objetivo.autorId}) `
			: "";
		setRespondiendoA({ hiloId, inicial });
	};

	const respuestasAEliminar = aEliminar
		? (respuestasPorPadre.get(aEliminar.id)?.length ?? 0)
		: 0;

	return (
		<section aria-labelledby="comentarios" className="space-y-4">
			<div className="flex items-center gap-2">
				<MessageSquare className="h-4 w-4 text-tinta-tenue" />
				<h2 id="comentarios" className="text-lg font-semibold text-tinta">
					Comentarios
					{comentarios.length > 0 && (
						<span className="ml-1.5 text-sm font-normal text-tinta-tenue">
							({data?.totalElementos})
						</span>
					)}
				</h2>
			</div>

			{isLoading ? (
				<Spinner />
			) : comentarios.length === 0 ? (
				<p className="rounded-lg border border-dashed border-borde px-4 py-5 text-center text-sm text-tinta-tenue">
					Aún no hay comentarios. Escribe el primero abajo.
				</p>
			) : (
				<ul className="divide-y divide-borde">
					{raices.map((raiz) => {
						const respuestas = respuestasPorPadre.get(raiz.id) ?? [];
						const hiloActivo = respondiendoA?.hiloId === raiz.id;
						return (
							<li key={raiz.id} className="py-4 first:pt-1 last:pb-1">
								<Comentario
									tarea={tarea}
									comentario={raiz}
									onResponder={(c) => abrirRespuesta(raiz.id, c)}
									onEliminar={setAEliminar}
								/>
								{(respuestas.length > 0 || hiloActivo) && (
									<div className="ml-4 mt-3 space-y-3 border-l border-borde pl-5">
										{respuestas.length > 0 && (
											<ul className="space-y-3">
												{respuestas.map((resp) => (
													<li key={resp.id}>
														<Comentario
															tarea={tarea}
															comentario={resp}
															esRespuesta
															onResponder={(c) => abrirRespuesta(raiz.id, c)}
															onEliminar={setAEliminar}
														/>
													</li>
												))}
											</ul>
										)}
										{hiloActivo && (
											<EditorComentario
												key={respondiendoA.inicial}
												tarea={tarea}
												inicial={respondiendoA.inicial}
												textoEnviar="Responder"
												autoFocus
												onCancelar={() => setRespondiendoA(null)}
												onEnviar={(contenido) =>
													crear.mutateAsync(
														{ contenido, padreId: raiz.id },
														{ onSuccess: () => setRespondiendoA(null) },
													)
												}
											/>
										)}
									</div>
								)}
							</li>
						);
					})}
				</ul>
			)}

			<div className="flex items-start gap-3 pt-1">
				{usuario && (
					<Avatar
						nombre={usuario.nombre}
						url={usuario.avatarUrl}
						className="mt-1 hidden size-8 shrink-0 sm:flex"
					/>
				)}
				<div className="min-w-0 flex-1">
					<EditorComentario
						tarea={tarea}
						textoEnviar="Comentar"
						onEnviar={(contenido) => crear.mutateAsync({ contenido })}
					/>
				</div>
			</div>

			<ConfirmDialog
				abierto={aEliminar !== null}
				titulo="¿Eliminar el comentario?"
				mensaje={
					respuestasAEliminar > 0
						? `Se borrará para siempre junto con ${respuestasAEliminar} ${respuestasAEliminar === 1 ? "respuesta" : "respuestas"}.`
						: "Se borrará para siempre."
				}
				textoConfirmar="Eliminar"
				peligroso
				isLoading={eliminar.isPending}
				onCancelar={() => setAEliminar(null)}
				onConfirmar={() =>
					aEliminar &&
					eliminar.mutate(aEliminar.id, { onSuccess: () => setAEliminar(null) })
				}
			/>
		</section>
	);
}
