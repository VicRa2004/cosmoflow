import { createFileRoute } from "@tanstack/react-router";
import { TareaLecturaPage } from "@/modules/tareas/pages/TareaLecturaPage";

export const Route = createFileRoute("/_authenticated/tareas/$id")({
	component: function LeerTarea() {
		const { id } = Route.useParams();
		return <TareaLecturaPage id={Number(id)} />;
	},
});
