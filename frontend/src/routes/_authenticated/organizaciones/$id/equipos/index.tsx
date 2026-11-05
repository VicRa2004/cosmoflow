import { createFileRoute } from "@tanstack/react-router";
import { EquiposCard } from "@/modules/equipos/components/EquiposCard";
import { useOrganizacionActual } from "@/modules/organizaciones/hooks/useOrganizacionActual";

export const Route = createFileRoute(
	"/_authenticated/organizaciones/$id/equipos/",
)({
	component: function EquiposOrganizacion() {
		return <EquiposCard organizacion={useOrganizacionActual()} />;
	},
});
