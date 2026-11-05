import { createFileRoute } from "@tanstack/react-router";
import { EquipoPage } from "@/modules/equipos/pages/EquipoPage";
import { useOrganizacionActual } from "@/modules/organizaciones/hooks/useOrganizacionActual";

export const Route = createFileRoute(
	"/_authenticated/organizaciones/$id/equipos/$equipoId",
)({
	component: function VerEquipo() {
		const { equipoId } = Route.useParams();
		return (
			<EquipoPage
				key={equipoId}
				organizacion={useOrganizacionActual()}
				equipoId={Number(equipoId)}
			/>
		);
	},
});
