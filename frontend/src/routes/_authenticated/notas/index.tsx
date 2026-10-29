import { createFileRoute } from "@tanstack/react-router";
import { NotasPage } from "@/modules/notas/pages/NotasPage";
import { contextoNotaSearch } from "@/modules/notas/schemas/notaSchemas";

export const Route = createFileRoute("/_authenticated/notas/")({
	validateSearch: contextoNotaSearch,
	component: function Notas() {
		return <NotasPage contexto={Route.useSearch()} />;
	},
});
