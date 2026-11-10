import { createFileRoute } from "@tanstack/react-router";
import { BovedaNotas } from "@/modules/notas/pages/BovedaNotas";

export const Route = createFileRoute("/_authenticated/notas/")({
	component: function Notas() {
		return <BovedaNotas contexto={Route.useSearch()} />;
	},
});
