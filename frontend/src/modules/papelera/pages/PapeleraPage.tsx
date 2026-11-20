import type { UseQueryResult } from "@tanstack/react-query";
import { ListTodo, RotateCcw, StickyNote, Trash2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/core/components/ui/Button";
import { ConfirmDialog } from "@/core/components/ui/ConfirmDialog";
import { EmptyState } from "@/core/components/ui/EmptyState";
import { EncabezadoPagina } from "@/core/components/ui/EncabezadoPagina";
import { AccionesFila, type Pagina, Tabla } from "@/core/components/ui/Table";
import type { TipoPapelera } from "../api/papeleraApi";
import {
	usePapeleraMutation,
	usePapeleraNotasQuery,
	usePapeleraTareasQuery,
} from "../hooks/usePapelera";

interface Elemento {
	id: number;
	titulo: string;
}

/** Una lista de la papelera con restaurar y borrar del todo (con confirmación). */
function SeccionPapelera({
	tipo,
	useLista,
}: {
	tipo: TipoPapelera;
	useLista: (pagina: number) => UseQueryResult<Pagina<Elemento>>;
}) {
	const [pagina, setPagina] = useState(1);
	const { data, isLoading, error } = useLista(pagina);
	const { restaurar, eliminar } = usePapeleraMutation(tipo);
	const [aBorrar, setABorrar] = useState<Elemento | null>(null);
	const [titulo, singular] =
		tipo === "tareas" ? ["Tareas", "tarea"] : ["Notas", "nota"];

	return (
		<section className="space-y-3">
			<h2 className="text-sm font-medium text-tinta-suave">{titulo}</h2>
			<Tabla
				etiqueta={`${titulo} en la papelera`}
				columnas={[
					{ cabecera: "Título", celda: (e) => e.titulo },
					{
						cabecera: <span className="sr-only">Acciones</span>,
						className: "text-right",
						celda: (e) => (
							<AccionesFila>
								<Button
									variant="ghost"
									size="sm"
									onClick={() => restaurar.mutate(e.id)}
									disabled={restaurar.isPending}
									aria-label={`Restaurar ${e.titulo}`}
								>
									<RotateCcw className="h-3.5 w-3.5" />
									<span className="hidden sm:inline">Restaurar</span>
								</Button>
								<Button
									variant="dangerGhost"
									size="sm"
									onClick={() => setABorrar(e)}
									aria-label={`Borrar definitivamente ${e.titulo}`}
								>
									<Trash2 className="h-3.5 w-3.5" />
									<span className="hidden sm:inline">Borrar</span>
								</Button>
							</AccionesFila>
						),
					},
				]}
				datos={data}
				clave={(e) => e.id}
				onCambioPagina={setPagina}
				isLoading={isLoading}
				error={error}
				vacio={
					<EmptyState
						icono={tipo === "tareas" ? ListTodo : StickyNote}
						titulo={`No hay ${tipo} en la papelera`}
					/>
				}
			/>
			<ConfirmDialog
				abierto={aBorrar !== null}
				titulo={`¿Borrar la ${singular} definitivamente?`}
				mensaje={`«${aBorrar?.titulo ?? ""}» se borrará para siempre y no se podrá recuperar.`}
				textoConfirmar="Borrar definitivamente"
				peligroso
				isLoading={eliminar.isPending}
				onCancelar={() => setABorrar(null)}
				onConfirmar={() =>
					aBorrar &&
					eliminar.mutate(aBorrar.id, { onSuccess: () => setABorrar(null) })
				}
			/>
		</section>
	);
}

/** Tareas y notas borradas que el usuario aún vería; se borran solas a los 30 días. */
export function PapeleraPage() {
	return (
		<div className="space-y-8">
			<EncabezadoPagina
				titulo="Papelera"
				descripcion="Lo que se elimina queda aquí 30 días antes de borrarse para siempre."
			/>
			<SeccionPapelera tipo="tareas" useLista={usePapeleraTareasQuery} />
			<SeccionPapelera tipo="notas" useLista={usePapeleraNotasQuery} />
		</div>
	);
}
