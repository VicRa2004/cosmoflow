import { createFileRoute } from "@tanstack/react-router";
import { OrganizacionPage } from "@/modules/organizaciones/pages/OrganizacionPage";

export const Route = createFileRoute("/_authenticated/organizaciones/$id")({
	component: function VerOrganizacion() {
		const { id } = Route.useParams();
		return <OrganizacionPage key={id} id={Number(id)} />;
	},
});
