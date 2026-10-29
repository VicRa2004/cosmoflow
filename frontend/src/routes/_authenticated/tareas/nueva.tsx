import { createFileRoute } from "@tanstack/react-router";
import { TareaEditorPage } from "@/modules/tareas/pages/TareaEditorPage";

export const Route = createFileRoute("/_authenticated/tareas/nueva")({
	component: () => <TareaEditorPage />,
});
