import { createFileRoute } from "@tanstack/react-router";
import { OrganizacionesPage } from "@/modules/organizaciones/pages/OrganizacionesPage";

export const Route = createFileRoute("/_authenticated/organizaciones/")({
	component: OrganizacionesPage,
});
