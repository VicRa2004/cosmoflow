import { MessageSquareReply, Pencil, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { z } from "zod";
import { useAuthStore } from "@/core/auth/store";
import { useAppForm } from "@/core/components/form/useAppForm";
import { Avatar } from "@/core/components/ui/Avatar";
import { Button } from "@/core/components/ui/Button";
import { ConfirmDialog } from "@/core/components/ui/ConfirmDialog";
import { Spinner } from "@/core/components/ui/Spinner";
import { ContenidoMarkdown } from "@/modules/adjuntos/components/ContenidoMarkdown";
import type { ComentarioTareaDto } from "../api/comentariosApi";
import { destinoDe, type TareaDto } from "../api/tareasApi";
import {
	useComentariosMutation,
	useComentariosQuery,
} from "../hooks/useComentarios";
import { EditorTarea } from "./EditorTarea";

const comentarioSchema = z.object({
	contenido: z
		.string()
		.trim()
		.min(1, "Escribe algo antes de enviar")
		.max(10_000, "Máximo 10.000 caracteres"),
});

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

/** Editor de un comentario: nuevo, respuesta en hilo o edición de uno existente. */
function FormComentario({
	tarea,
	inicial = "",
	label = "Comentario",
	textoEnviar,
	onEnviar,
	onCancelar,
}: {
	tarea: TareaDto;
	inicial?: string;
	label?: string;
	textoEnviar: string;
	onEnviar: (contenido: string) => Promise<unknown>;
	onCancelar?: () => void;
}) {
	// El editor WYSIWYG no se vacía con `reset`: se vuelve a montar con otra `key`.
	const [vuelta, setVuelta] = useState(0);
	const { organizacionId, equipoId, proyectoId } = tarea;
	const form = useAppForm({
		defaultValues: { contenido: inicial },
		validators: { onSubmit: comentarioSchema },
		onSubmit: async ({ value }) => {
			await onEnviar(comentarioSchema.parse(value).contenido);
			form.reset();
			setVuelta((n) => n + 1);
		},
	});
	return (
		<form.AppForm>
			<form.Formulario className="space-y-2">
				<form.AppField name="contenido">
					{() => (
						<EditorTarea
							key={`${vuelta}-${inicial}`}
							organizacionId={organizacionId}
							equipoId={equipoId}
							proyectoId={proyectoId}
							label={label}
							ambito={
								organizacionId !== null
									? destinoDe({ organizacionId, equipoId, proyectoId })
									: undefined
							}
						/>
					)}
				</form.AppField>
				<div className="flex justify-end gap-2">
					{onCancelar && (
						<Button
							type="button"
							variant="ghost"
							size="sm"
							onClick={onCancelar}
						>
							Cancelar
						</Button>
					)}
					<form.BotonEnviar size="sm">{textoEnviar}</form.BotonEnviar>
				</div>
			</form.Formulario>
		</form.AppForm>
	);
}

function ComentarioItem({
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
		<div className="group/comentario space-y-2">
			<div className="flex items-center justify-between gap-2">
				<div className="flex items-center gap-2 min-w-0">
					<Avatar
						nombre={comentario.autorNombre}
						url={comentario.autorAvatarUrl}
						className={esRespuesta ? "size-6 text-[11px]" : "size-7 text-xs"}
					/>
					<p className="text-sm truncate">
						<span className="font-medium text-tinta">
							{comentario.autorNombre}
						</span>{" "}
						<span className="text-tinta-tenue">
							· {fecha(comentario.createdAt)}
							{comentario.editadoEn && " (editado)"}
						</span>
					</p>
				</div>
				{!editando && (
					<div className="flex shrink-0 gap-1 opacity-0 group-focus-within/comentario:opacity-100 group-hover/comentario:opacity-100 [@media(hover:none)]:opacity-100">
						<Button
							variant="ghost"
							size="sm"
							onClick={() => onResponder(comentario)}
							aria-label={`Responder a ${comentario.autorNombre}`}
							title="Responder"
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
									title="Editar"
								>
									<Pencil className="h-3.5 w-3.5" />
								</Button>
								<Button
									variant="dangerGhost"
									size="sm"
									onClick={() => onEliminar(comentario)}
									aria-label="Eliminar comentario"
									title="Eliminar"
								>
									<Trash2 className="h-3.5 w-3.5" />
								</Button>
							</>
						)}
					</div>
				)}
			</div>
			<div className={esRespuesta ? "pl-8" : "pl-9"}>
				{editando ? (
					<FormComentario
						tarea={tarea}
						inicial={comentario.contenido}
						textoEnviar="Guardar"
						onCancelar={() => setEditando(false)}
						onEnviar={(contenido) =>
							actualizar.mutateAsync(
								{ id: comentario.id, contenido },
								{ onSuccess: () => setEditando(false) },
							)
						}
					/>
				) : (
					<ContenidoMarkdown>{comentario.contenido}</ContenidoMarkdown>
				)}
			</div>
		</div>
	);
}

/** Conversación de una tarea: hilos de 1 nivel en Markdown con menciones (`@`) en las compartidas. */
export function ComentariosTarea({ tarea }: { tarea: TareaDto }) {
	const yo = useAuthStore((state) => state.usuario?.id);
	const { data, isLoading } = useComentariosQuery(tarea.id);
	const { crear, eliminar } = useComentariosMutation(tarea.id);
	const [aEliminar, setAEliminar] = useState<ComentarioTareaDto | null>(null);
	const [respondiendoA, setRespondiendoA] = useState<{
		hiloId: number;
		autorNombre: string;
		inicial: string;
	} | null>(null);

	const comentarios = data?.datos ?? [];
	const { raices, respuestasPorPadre } = useMemo(
		() => agruparHilos(comentarios),
		[comentarios],
	);

	const abrirRespuesta = (hiloId: number, objetivo: ComentarioTareaDto) => {
		// Si es una tarea compartida y respondes a otra persona dentro del hilo,
		// pre-cargamos su mención para que quede etiquetada directamente.
		const etiquetar =
			tarea.organizacionId !== null &&
			objetivo.padreId !== null &&
			objetivo.autorId !== yo;
		const inicial = etiquetar
			? `[@${objetivo.autorNombre}](mencion:${objetivo.autorId}) `
			: "";
		setRespondiendoA({ hiloId, autorNombre: objetivo.autorNombre, inicial });
	};

	const respuestasAEliminar = aEliminar
		? (respuestasPorPadre.get(aEliminar.id)?.length ?? 0)
		: 0;

	return (
		<section aria-labelledby="comentarios" className="space-y-4">
			<h2 id="comentarios" className="text-lg font-semibold text-tinta">
				Comentarios{comentarios.length > 0 && ` (${data?.totalElementos})`}
			</h2>
			{isLoading ? (
				<Spinner />
			) : raices.length === 0 ? (
				<p className="text-sm text-tinta-tenue">Aún no hay comentarios.</p>
			) : (
				<ul>
					{raices.map((raiz) => {
						const respuestas = respuestasPorPadre.get(raiz.id) ?? [];
						const hiloActivo = respondiendoA?.hiloId === raiz.id;
						return (
							<li
								key={raiz.id}
								className="border-b border-borde py-4 last:border-b-0"
							>
								<ComentarioItem
									tarea={tarea}
									comentario={raiz}
									onResponder={(c) => abrirRespuesta(raiz.id, c)}
									onEliminar={setAEliminar}
								/>
								{(respuestas.length > 0 || hiloActivo) && (
									<div className="ml-3.5 mt-3 space-y-3 border-l border-borde pl-5">
										{respuestas.length > 0 && (
											<ul className="space-y-3">
												{respuestas.map((resp) => (
													<li key={resp.id}>
														<ComentarioItem
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
											<div className="pt-1">
												<FormComentario
													tarea={tarea}
													inicial={respondiendoA.inicial}
													label={`Responder a ${respondiendoA.autorNombre}`}
													textoEnviar="Responder"
													onCancelar={() => setRespondiendoA(null)}
													onEnviar={(contenido) =>
														crear.mutateAsync(
															{ contenido, padreId: raiz.id },
															{ onSuccess: () => setRespondiendoA(null) },
														)
													}
												/>
											</div>
										)}
									</div>
								)}
							</li>
						);
					})}
				</ul>
			)}
			<FormComentario
				tarea={tarea}
				textoEnviar="Comentar"
				onEnviar={(contenido) => crear.mutateAsync({ contenido })}
			/>
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
