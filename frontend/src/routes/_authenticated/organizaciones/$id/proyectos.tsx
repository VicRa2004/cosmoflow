import { createFileRoute } from "@tanstack/react-router";
import { useOrganizacionActual } from "@/modules/organizaciones/hooks/useOrganizacionActual";
import { ProyectosCard } from "@/modules/proyectos/components/ProyectosCard";

export const Route = createFileRoute(
	"/_authenticated/organizaciones/$id/proyectos",
)({
	component: function ProyectosOrganizacion() {
		return <ProyectosCard organizacion={useOrganizacionActual()} />;
	},
});
