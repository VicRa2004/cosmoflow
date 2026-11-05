import { createFileRoute } from "@tanstack/react-router";
import { useOrganizacionActual } from "@/modules/organizaciones/hooks/useOrganizacionActual";
import { AjustesOrganizacionPage } from "@/modules/organizaciones/pages/AjustesOrganizacionPage";

export const Route = createFileRoute(
	"/_authenticated/organizaciones/$id/ajustes",
)({
	component: function AjustesOrganizacion() {
		return <AjustesOrganizacionPage organizacion={useOrganizacionActual()} />;
	},
});
