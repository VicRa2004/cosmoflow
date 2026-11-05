import { createFileRoute } from "@tanstack/react-router";
import { OrganizacionLayout } from "@/modules/organizaciones/pages/OrganizacionLayout";

export const Route = createFileRoute("/_authenticated/organizaciones/$id")({
	component: function VerOrganizacion() {
		const { id } = Route.useParams();
		return <OrganizacionLayout key={id} id={Number(id)} />;
	},
});
