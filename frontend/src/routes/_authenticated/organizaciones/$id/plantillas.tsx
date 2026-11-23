import { createFileRoute } from "@tanstack/react-router";
import { useOrganizacionActual } from "@/modules/organizaciones/hooks/useOrganizacionActual";
import { puedeEn } from "@/modules/organizaciones/utils/permisos";
import { PlantillasCard } from "@/modules/plantillas/components/PlantillasCard";

export const Route = createFileRoute(
	"/_authenticated/organizaciones/$id/plantillas",
)({
	component: function PlantillasOrganizacion() {
		const organizacion = useOrganizacionActual();
		return (
			<PlantillasCard
				organizacionId={organizacion.id}
				puedeGestionar={puedeEn(organizacion, "plantillas:gestionar")}
			/>
		);
	},
});
