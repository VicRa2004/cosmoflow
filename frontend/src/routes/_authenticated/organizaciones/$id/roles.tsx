import { createFileRoute } from "@tanstack/react-router";
import { RolesCard } from "@/modules/organizaciones/components/RolesCard";
import { SinAccesoSeccion } from "@/modules/organizaciones/components/SinAccesoSeccion";
import { useOrganizacionActual } from "@/modules/organizaciones/hooks/useOrganizacionActual";
import { puedeEn } from "@/modules/organizaciones/utils/permisos";

export const Route = createFileRoute(
	"/_authenticated/organizaciones/$id/roles",
)({
	component: function RolesOrganizacion() {
		const organizacion = useOrganizacionActual();
		return puedeEn(organizacion, "roles:gestionar") ? (
			<RolesCard organizacionId={organizacion.id} />
		) : (
			<SinAccesoSeccion />
		);
	},
});
