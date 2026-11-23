import { useCanGoBack, useNavigate, useRouter } from "@tanstack/react-router";
import { Spinner } from "@/core/components/ui/Spinner";
import { SelectorPlantilla } from "@/modules/plantillas/components/SelectorPlantilla";
import { usePlantillasDisponibles } from "@/modules/plantillas/hooks/usePlantillas";
import { TareaForm } from "../components/TareaForm";
import { useTareaQuery } from "../hooks/useTareasQuery";
import type { NuevaTareaSearch } from "../schemas/tareaSchemas";

const Cargando = () => (
	<div className="flex justify-center py-16 text-tinta-tenue">
		<Spinner />
	</div>
);

/** Alta (sin `id`, en `contexto` si viene) o edición de una tarea a página completa. */
export function TareaEditorPage({
	id,
	contexto,
}: {
	id?: number;
	contexto?: NuevaTareaSearch;
}) {
	const router = useRouter();
	const navigate = useNavigate();
	const puedeVolver = useCanGoBack();
	const { data, error } = useTareaQuery(id);
	const { personales, deOrganizacion } = usePlantillasDisponibles(
		contexto?.organizacionId,
		id === undefined,
	);
	// Vuelve a donde se abrió; si se entró por URL, a su lectura (o a la lista si es nueva).
	const volver = () =>
		puedeVolver
			? router.history.back()
			: id === undefined
				? navigate({ to: "/tareas" })
				: navigate({ to: "/tareas/$id", params: { id: String(id) } });

	if (error) throw error;
	if (id !== undefined) {
		if (!data) return <Cargando />;
		return (
			<TareaForm
				key={id}
				inicial={data}
				onGuardado={volver}
				onVolver={volver}
			/>
		);
	}

	const { plantillaId, ...destino } = contexto ?? {};
	// Con plantilla, el formulario espera a tenerla: sus valores iniciales no cambian después.
	if (plantillaId !== undefined && (!personales || !deOrganizacion)) {
		return <Cargando />;
	}
	const plantilla = [...(deOrganizacion ?? []), ...(personales ?? [])].find(
		(p) => p.id === plantillaId,
	);
	return (
		<div className="space-y-4">
			<SelectorPlantilla
				personales={personales ?? []}
				deOrganizacion={deOrganizacion ?? []}
				valor={plantilla?.id}
				onElegir={(nueva) =>
					navigate({
						to: "/tareas/nueva",
						search: { ...destino, plantillaId: nueva },
						replace: true,
					})
				}
			/>
			<TareaForm
				key={`nueva-${plantilla?.id ?? ""}`}
				contexto={destino}
				plantilla={plantilla}
				onGuardado={volver}
				onVolver={volver}
			/>
		</div>
	);
}
