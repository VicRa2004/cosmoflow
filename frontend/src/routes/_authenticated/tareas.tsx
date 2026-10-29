import { createFileRoute } from "@tanstack/react-router";
import { TareasPage } from "@/modules/tareas/pages/TareasPage";

export const Route = createFileRoute("/_authenticated/tareas")({
	component: TareasPage,
});
