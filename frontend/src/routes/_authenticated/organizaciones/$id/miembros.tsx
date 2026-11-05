import { createFileRoute } from "@tanstack/react-router";
import { InvitacionesCard } from "@/modules/organizaciones/components/InvitacionesCard";
import { MiembrosCard } from "@/modules/organizaciones/components/MiembrosCard";
import { useOrganizacionActual } from "@/modules/organizaciones/hooks/useOrganizacionActual";
import { puedeEn } from "@/modules/organizaciones/utils/permisos";

export const Route = createFileRoute(
	"/_authenticated/organizaciones/$id/miembros",
)({
	component: function MiembrosOrganizacion() {
		const organizacion = useOrganizacionActual();
		return (
			<div className="space-y-6">
				<MiembrosCard organizacion={organizacion} />
				{puedeEn(organizacion, "miembros:invitar") && (
					<InvitacionesCard organizacionId={organizacion.id} />
				)}
			</div>
		);
	},
});
