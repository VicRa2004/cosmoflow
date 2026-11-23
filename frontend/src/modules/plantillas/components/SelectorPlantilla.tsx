import { Select } from "@/core/components/ui/Select";
import type { PlantillaTareaDto } from "../api/plantillasApi";

/** «Desde plantilla» al crear una tarea; elegir una rellena el formulario. */
export function SelectorPlantilla({
	personales,
	deOrganizacion,
	valor,
	onElegir,
}: {
	personales: PlantillaTareaDto[];
	deOrganizacion: PlantillaTareaDto[];
	valor?: number;
	onElegir: (id: number | undefined) => void;
}) {
	if (personales.length + deOrganizacion.length === 0) return null;
	const opciones = (lista: PlantillaTareaDto[]) =>
		lista.map((p) => (
			<option key={p.id} value={p.id}>
				{p.nombre}
			</option>
		));
	return (
		<div className="mx-auto max-w-3xl">
			<div className="max-w-xs">
				<Select
					label="Desde plantilla"
					value={valor ?? ""}
					onChange={(e) =>
						onElegir(e.target.value ? Number(e.target.value) : undefined)
					}
				>
					<option value="">En blanco</option>
					{deOrganizacion.length > 0 ? (
						<>
							<optgroup label="De la organización">
								{opciones(deOrganizacion)}
							</optgroup>
							<optgroup label="Mías">{opciones(personales)}</optgroup>
						</>
					) : (
						opciones(personales)
					)}
				</Select>
			</div>
		</div>
	);
}
