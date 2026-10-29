import { useState } from "react";
import { Button } from "@/core/components/ui/Button";
import type { EquipoDto } from "../api/equiposApi";
import { useGestionEquipos } from "../hooks/useEquipos";
import { CasillasIds } from "./CasillasIds";

/** El líder elige quién más crea y asigna tareas del equipo (RN-22). */
export function DelegadosForm({
	organizacionId,
	equipo,
	nombre,
	onGuardado,
}: {
	organizacionId: number;
	equipo: EquipoDto;
	nombre: Map<number, string>;
	onGuardado: () => void;
}) {
	const { delegados } = useGestionEquipos(organizacionId);
	const [seleccion, setSeleccion] = useState(
		equipo.miembros.filter((m) => m.puedeCrearTareas).map((m) => m.usuarioId),
	);

	return (
		<form
			className="space-y-4"
			onSubmit={(e) => {
				e.preventDefault();
				delegados.mutate(
					{ id: equipo.id, usuarioIds: seleccion },
					{ onSuccess: onGuardado },
				);
			}}
		>
			<CasillasIds
				leyenda="Pueden crear y asignar tareas además del líder"
				opciones={equipo.miembros
					.filter((m) => m.usuarioId !== equipo.liderId)
					.map((m) => ({
						id: m.usuarioId,
						etiqueta: nombre.get(m.usuarioId) ?? `#${m.usuarioId}`,
					}))}
				valor={seleccion}
				onChange={setSeleccion}
			/>
			<div className="flex justify-end">
				<Button type="submit" isLoading={delegados.isPending}>
					Guardar
				</Button>
			</div>
		</form>
	);
}
