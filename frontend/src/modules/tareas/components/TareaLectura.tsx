import { usePermisos } from "@/core/auth/usePermisos";
import { DialogoLectura } from "@/modules/adjuntos/components/DialogoLectura";
import { TagsBadges } from "@/modules/tags/components/TagsBadges";
import type { TareaDto } from "../api/tareasApi";
import { ETIQUETAS_ESTADO, ETIQUETAS_PRIORIDAD } from "../schemas/tareaSchemas";
import { VencimientoTarea } from "./celdas";

interface TareaLecturaProps {
	/** `null` = cerrado. */
	tarea: TareaDto | null;
	onCerrar: () => void;
	onEditar: (tarea: TareaDto) => void;
}

export function TareaLectura({ tarea, onCerrar, onEditar }: TareaLecturaProps) {
	const { puede } = usePermisos();

	return (
		<DialogoLectura
			abierto={tarea !== null}
			onCerrar={onCerrar}
			titulo={tarea?.titulo ?? ""}
			contenido={tarea?.contenido ?? ""}
			onEditar={
				tarea && puede("tareas:actualizar") ? () => onEditar(tarea) : undefined
			}
			detalles={
				tarea && (
					<dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-sm">
						<dt className="text-tinta-tenue">Estado</dt>
						<dd>{ETIQUETAS_ESTADO[tarea.estado]}</dd>
						<dt className="text-tinta-tenue">Prioridad</dt>
						<dd>{ETIQUETAS_PRIORIDAD[tarea.prioridad]}</dd>
						<dt className="text-tinta-tenue">Vence</dt>
						<dd>
							<VencimientoTarea tarea={tarea} />
						</dd>
						{tarea.tagIds.length > 0 && (
							<>
								<dt className="text-tinta-tenue">Tags</dt>
								<dd>
									<TagsBadges tagIds={tarea.tagIds} />
								</dd>
							</>
						)}
					</dl>
				)
			}
		/>
	);
}
