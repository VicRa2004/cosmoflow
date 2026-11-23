import { Plus } from "lucide-react";
import { Avatar } from "@/core/components/ui/Avatar";
import { Combobox } from "@/core/components/ui/Combobox";
import { useMiembrosDestino } from "../hooks/useMiembrosDestino";

interface CampoResponsablesProps {
	organizacionId: number;
	equipoId?: number | null;
	proyectoId?: number | null;
	valor: number[];
	onChange: (valor: number[]) => void;
}

/** Responsables entre quienes ven la tarea (RN-23, 44). Solo para tareas compartidas. */
export function CampoResponsables({
	organizacionId,
	equipoId,
	proyectoId,
	valor,
	onChange,
}: CampoResponsablesProps) {
	const miembros = useMiembrosDestino(organizacionId, equipoId, proyectoId);
	const elegidos = miembros.filter((m) => valor.includes(m.id));

	return (
		<Combobox
			multiple
			label="Responsables"
			vacio="Nadie más ve esta tarea."
			opciones={miembros.map((m) => ({
				id: m.id,
				etiqueta: m.nombre,
				icono: (
					<Avatar nombre={m.nombre} url={m.avatarUrl} className="size-6" />
				),
			}))}
			valor={valor}
			onChange={onChange}
		>
			{elegidos.length === 0 ? (
				<span className="flex items-center gap-1.5 text-tinta-tenue">
					<Plus aria-hidden className="size-4" />
					Sin responsables
				</span>
			) : (
				<>
					<span className="flex -space-x-1.5">
						{elegidos.slice(0, 3).map((m) => (
							<Avatar
								key={m.id}
								nombre={m.nombre}
								url={m.avatarUrl}
								className="size-6 ring-2 ring-superficie"
							/>
						))}
					</span>
					<span className="truncate">
						{elegidos.map((m) => m.nombre).join(", ")}
					</span>
				</>
			)}
		</Combobox>
	);
}
