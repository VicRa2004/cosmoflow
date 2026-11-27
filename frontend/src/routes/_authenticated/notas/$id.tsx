import { createFileRoute } from "@tanstack/react-router";
import { usePermisos } from "@/core/auth/usePermisos";
import { NotaEditorPage } from "@/modules/notas/pages/NotaEditorPage";
import { NotaLecturaPage } from "@/modules/notas/pages/NotaLecturaPage";

export const Route = createFileRoute("/_authenticated/notas/$id")({
	// Abrir una nota es editarla (se guarda sola); sin permiso, solo se lee.
	component: function AbrirNota() {
		const { id } = Route.useParams();
		const { puede } = usePermisos();
		return puede("notas:actualizar") ? (
			<NotaEditorPage key={id} id={Number(id)} />
		) : (
			<NotaLecturaPage id={Number(id)} />
		);
	},
});
