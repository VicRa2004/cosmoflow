import { createFileRoute } from "@tanstack/react-router";
import { NotaEditorPage } from "@/modules/notas/pages/NotaEditorPage";

export const Route = createFileRoute("/_authenticated/notas/$id_/editar")({
	component: function EditarNota() {
		const { id } = Route.useParams();
		return <NotaEditorPage id={Number(id)} />;
	},
});
