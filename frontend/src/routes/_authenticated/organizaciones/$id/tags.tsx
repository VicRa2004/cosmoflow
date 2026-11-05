import { createFileRoute } from "@tanstack/react-router";
import { TagsOrganizacionCard } from "@/modules/organizaciones/components/TagsOrganizacionCard";
import { useOrganizacionActual } from "@/modules/organizaciones/hooks/useOrganizacionActual";
import { puedeEn } from "@/modules/organizaciones/utils/permisos";

export const Route = createFileRoute("/_authenticated/organizaciones/$id/tags")(
	{
		component: function TagsOrganizacion() {
			const organizacion = useOrganizacionActual();
			return (
				<TagsOrganizacionCard
					organizacionId={organizacion.id}
					puedeGestionar={puedeEn(organizacion, "tags:gestionar")}
				/>
			);
		},
	},
);
