import { createFileRoute, Outlet } from "@tanstack/react-router";
import { BovedaNotas } from "@/modules/notas/pages/BovedaNotas";
import { contextoNotaSearch } from "@/modules/notas/schemas/notaSchemas";

export const Route = createFileRoute("/_authenticated/notas")({
	validateSearch: contextoNotaSearch,
	component: function Notas() {
		return (
			<BovedaNotas contexto={Route.useSearch()}>
				<Outlet />
			</BovedaNotas>
		);
	},
});
