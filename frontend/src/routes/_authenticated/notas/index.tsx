import { createFileRoute } from "@tanstack/react-router";
import { NotasPage } from "@/modules/notas/pages/NotasPage";

export const Route = createFileRoute("/_authenticated/notas/")({
	component: NotasPage,
});
