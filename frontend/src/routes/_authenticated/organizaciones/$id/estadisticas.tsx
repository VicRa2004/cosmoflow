import { createFileRoute } from "@tanstack/react-router";
import { EstadisticasOrganizacionPage } from "@/modules/organizaciones/pages/EstadisticasOrganizacionPage";

export const Route = createFileRoute(
	"/_authenticated/organizaciones/$id/estadisticas",
)({
	component: EstadisticasOrganizacionPage,
});
