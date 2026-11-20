import { Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
import { z } from "zod";
import { useAuthStore } from "@/core/auth/store";
import { useAppForm } from "@/core/components/form/useAppForm";
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

/** Editor de un comentario: nuevo (se vacía al enviar) o edición de uno existente. */
function FormComentario({
	tarea,
	inicial = "",
	textoEnviar,
	onEnviar,
	onCancelar,
}: {
	tarea: TareaDto;
	inicial?: string;
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
							key={vuelta}
							organizacionId={organizacionId}
							equipoId={equipoId}
							proyectoId={proyectoId}
							label="Comentario"
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

function Comentario({
	tarea,
	comentario,
	onEliminar,
}: {
	tarea: TareaDto;
	comentario: ComentarioTareaDto;
	onEliminar: (c: ComentarioTareaDto) => void;
}) {
	const yo = useAuthStore((state) => state.usuario?.id);
	const { actualizar } = useComentariosMutation(tarea.id);
	const [editando, setEditando] = useState(false);
	const propio = comentario.autorId === yo;

	return (
		<li className="group/comentario space-y-2 border-b border-borde py-4 last:border-b-0">
			<div className="flex items-center justify-between gap-2">
				<p className="text-sm">
					<span className="font-medium text-tinta">
						{comentario.autorNombre}
					</span>{" "}
					<span className="text-tinta-tenue">
						· {fecha(comentario.createdAt)}
						{comentario.editadoEn && " (editado)"}
					</span>
				</p>
				{propio && !editando && (
					<div className="flex gap-1 opacity-0 group-focus-within/comentario:opacity-100 group-hover/comentario:opacity-100 [@media(hover:none)]:opacity-100">
						<Button
							variant="ghost"
							size="sm"
							onClick={() => setEditando(true)}
							aria-label="Editar comentario"
						>
							<Pencil className="h-3.5 w-3.5" />
						</Button>
						<Button
							variant="dangerGhost"
							size="sm"
							onClick={() => onEliminar(comentario)}
							aria-label="Eliminar comentario"
						>
							<Trash2 className="h-3.5 w-3.5" />
						</Button>
					</div>
				)}
			</div>
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
		</li>
	);
}

/** Conversación de una tarea: comentarios en Markdown con menciones (`@`) en las compartidas. */
export function ComentariosTarea({ tarea }: { tarea: TareaDto }) {
	const { data, isLoading } = useComentariosQuery(tarea.id);
	const { crear, eliminar } = useComentariosMutation(tarea.id);
	const [aEliminar, setAEliminar] = useState<ComentarioTareaDto | null>(null);
	const comentarios = data?.datos ?? [];

	return (
		<section aria-labelledby="comentarios" className="space-y-4">
			<h2 id="comentarios" className="text-lg font-semibold text-tinta">
				Comentarios{comentarios.length > 0 && ` (${data?.totalElementos})`}
			</h2>
			{isLoading ? (
				<Spinner />
			) : comentarios.length === 0 ? (
				<p className="text-sm text-tinta-tenue">Aún no hay comentarios.</p>
			) : (
				<ul>
					{comentarios.map((c) => (
						<Comentario
							key={c.id}
							tarea={tarea}
							comentario={c}
							onEliminar={setAEliminar}
						/>
					))}
				</ul>
			)}
			<FormComentario
				tarea={tarea}
				textoEnviar="Comentar"
				onEnviar={(contenido) => crear.mutateAsync(contenido)}
			/>
			<ConfirmDialog
				abierto={aEliminar !== null}
				titulo="¿Eliminar el comentario?"
				mensaje="Se borrará para siempre."
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
