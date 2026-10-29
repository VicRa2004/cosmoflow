import { createFileRoute } from "@tanstack/react-router";
import { TareasPage } from "@/modules/tareas/pages/TareasPage";
import { contextoTareaSearch } from "@/modules/tareas/schemas/tareaSchemas";

export const Route = createFileRoute("/_authenticated/tareas/")({
	validateSearch: contextoTareaSearch,
	component: function Tareas() {
		return <TareasPage contexto={Route.useSearch()} />;
	},
});
