import { createFileRoute } from "@tanstack/react-router";
import { TareaEditorPage } from "@/modules/tareas/pages/TareaEditorPage";
import { nuevaTareaSearch } from "@/modules/tareas/schemas/tareaSchemas";

export const Route = createFileRoute("/_authenticated/tareas/nueva")({
	validateSearch: nuevaTareaSearch,
	component: function NuevaTarea() {
		return <TareaEditorPage contexto={Route.useSearch()} />;
	},
});
