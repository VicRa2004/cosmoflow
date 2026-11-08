import { createFileRoute } from "@tanstack/react-router";
import { WikilinkPage } from "@/modules/notas/pages/WikilinkPage";
import { enlaceNotaSearch } from "@/modules/notas/schemas/notaSchemas";

export const Route = createFileRoute("/_authenticated/notas/enlace")({
	validateSearch: enlaceNotaSearch,
	component: function EnlaceNota() {
		return <WikilinkPage {...Route.useSearch()} />;
	},
});
