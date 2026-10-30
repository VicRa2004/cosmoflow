import { createFileRoute } from "@tanstack/react-router";
import { NotaLecturaPage } from "@/modules/notas/pages/NotaLecturaPage";

export const Route = createFileRoute("/_authenticated/notas/$id")({
	component: function LeerNota() {
		const { id } = Route.useParams();
		return <NotaLecturaPage id={Number(id)} />;
	},
});
