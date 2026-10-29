import { createFileRoute } from "@tanstack/react-router";
import { TareaEditorPage } from "@/modules/tareas/pages/TareaEditorPage";

export const Route = createFileRoute("/_authenticated/tareas/$id")({
	component: function EditarTarea() {
		const { id } = Route.useParams();
		return <TareaEditorPage id={Number(id)} />;
	},
});
