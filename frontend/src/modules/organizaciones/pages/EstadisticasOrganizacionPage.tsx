import { Card } from "@/core/components/ui/Card";
import { useEquiposQuery } from "@/modules/equipos/hooks/useEquipos";
import { useProyectosQuery } from "@/modules/proyectos/hooks/useProyectos";
import { EstadisticasTareas } from "@/modules/tareas/components/EstadisticasTareas";
import { useMiembrosQuery } from "../hooks/useMiembros";
import { useOrganizacionActual } from "../hooks/useOrganizacionActual";

/** Tamaño de la organización y recuento de sus tareas (sin las de equipos y proyectos). */
export function EstadisticasOrganizacionPage() {
	const { id } = useOrganizacionActual();
	const { data: miembros } = useMiembrosQuery(id);
	const { data: equipos } = useEquiposQuery(id);
	const { data: proyectos } = useProyectosQuery(id);
	const cifras = [
		{ etiqueta: "Miembros", valor: miembros?.length },
		{ etiqueta: "Equipos", valor: equipos?.length },
		{ etiqueta: "Proyectos", valor: proyectos?.length },
	];

	return (
		<div className="space-y-4">
			<div className="grid grid-cols-3 gap-3">
				{cifras.map(({ etiqueta, valor }) => (
					<Card key={etiqueta} className="p-4 sm:p-4">
						<p className="text-2xl font-semibold tabular-nums text-tinta">
							{valor ?? "…"}
						</p>
						<p className="text-xs text-tinta-tenue">{etiqueta}</p>
					</Card>
				))}
			</div>
			<EstadisticasTareas
				destino={{ organizacionId: id }}
				titulo="Tareas de la organización"
				nombres={new Map(miembros?.map((m) => [m.usuarioId, m.nombre]))}
			/>
		</div>
	);
}
