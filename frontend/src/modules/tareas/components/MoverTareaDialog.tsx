import { useState } from "react";
import { Button } from "@/core/components/ui/Button";
import { Dialog } from "@/core/components/ui/Dialog";
import { Select } from "@/core/components/ui/Select";
import { useEquiposQuery } from "@/modules/equipos/hooks/useEquipos";
import { useOrganizacionesQuery } from "@/modules/organizaciones/hooks/useOrganizacionesQuery";
import { useProyectosQuery } from "@/modules/proyectos/hooks/useProyectos";
import type { DestinoTarea, TareaDto } from "../api/tareasApi";
import { useMoverTareaMutation } from "../hooks/useTareasMutation";

/** `"equipo:5"` / `"proyecto:2"` ↔ destino de la API. */
const aDestino = (valor: string): DestinoTarea | null => {
	const [tipo, id] = valor.split(":");
	if (!id) return null;
	return tipo === "equipo"
		? { equipoId: Number(id) }
		: { proyectoId: Number(id) };
};

function Destinos({ organizacionId }: { organizacionId: number }) {
	const { data: equipos = [] } = useEquiposQuery(organizacionId);
	const { data: proyectos = [] } = useProyectosQuery(organizacionId);
	return (
		<>
			<optgroup label="Equipos">
				{equipos.map((e) => (
					<option key={e.id} value={`equipo:${e.id}`}>
						{e.nombre}
					</option>
				))}
			</optgroup>
			<optgroup label="Proyectos">
				{proyectos.map((p) => (
					<option key={p.id} value={`proyecto:${p.id}`}>
						{p.nombre}
					</option>
				))}
			</optgroup>
		</>
	);
}

/** RN-45: una tarea personal pasa a un equipo o proyecto, sin vuelta atrás. */
export function MoverTareaDialog({
	tarea,
	abierto,
	onCerrar,
	onMovida,
}: {
	tarea: TareaDto;
	abierto: boolean;
	onCerrar: () => void;
	onMovida: () => void;
}) {
	// shortcut: las 100 primeras organizaciones; paginar si alguien está en más.
	const { data: organizaciones } = useOrganizacionesQuery({
		pagina: 1,
		limite: 100,
	});
	const [organizacionId, setOrganizacionId] = useState<number>();
	const [destino, setDestino] = useState("");
	const mover = useMoverTareaMutation();
	const elegido = aDestino(destino);

	return (
		<Dialog abierto={abierto} onCerrar={onCerrar} titulo="Mover tarea">
			<form
				className="space-y-4"
				onSubmit={(e) => {
					e.preventDefault();
					if (!elegido) return;
					mover.mutate(
						{ id: tarea.id, destino: elegido },
						{ onSuccess: onMovida },
					);
				}}
			>
				<p className="text-sm text-tinta-tenue">
					Pasará a ser del equipo o proyecto y ya no volverá a ser personal. Sus
					tags personales se quitan.
				</p>
				<Select
					label="Organización"
					value={organizacionId ?? ""}
					onChange={(e) => {
						setOrganizacionId(
							e.target.value ? Number(e.target.value) : undefined,
						);
						setDestino("");
					}}
				>
					<option value="">Elige una organización</option>
					{organizaciones?.datos.map((o) => (
						<option key={o.id} value={o.id}>
							{o.nombre}
						</option>
					))}
				</Select>
				{organizacionId && (
					<Select
						label="Destino"
						value={destino}
						onChange={(e) => setDestino(e.target.value)}
					>
						<option value="">Elige un equipo o proyecto</option>
						<Destinos organizacionId={organizacionId} />
					</Select>
				)}
				<div className="flex justify-end">
					<Button type="submit" disabled={!elegido} isLoading={mover.isPending}>
						Mover
					</Button>
				</div>
			</form>
		</Dialog>
	);
}
