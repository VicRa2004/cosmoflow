import { createFileRoute } from "@tanstack/react-router";
import { CalendarioPage } from "@/modules/tareas/pages/CalendarioPage";

export const Route = createFileRoute("/_authenticated/calendario")({
	component: CalendarioPage,
});
