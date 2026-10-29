import { createFileRoute } from "@tanstack/react-router";
import { NotaEditorPage } from "@/modules/notas/pages/NotaEditorPage";
import { contextoNotaSearch } from "@/modules/notas/schemas/notaSchemas";

export const Route = createFileRoute("/_authenticated/notas/nueva")({
	validateSearch: contextoNotaSearch,
	component: function NuevaNota() {
		return <NotaEditorPage contexto={Route.useSearch()} />;
	},
});
