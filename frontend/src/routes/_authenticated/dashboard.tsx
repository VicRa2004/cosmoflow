import { createFileRoute } from "@tanstack/react-router";
import { PendientesPage } from "@/modules/tareas/pages/PendientesPage";

export const Route = createFileRoute("/_authenticated/dashboard")({
	component: PendientesPage,
});
