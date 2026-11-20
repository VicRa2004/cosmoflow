import { createFileRoute } from "@tanstack/react-router";
import { PapeleraPage } from "@/modules/papelera/pages/PapeleraPage";

export const Route = createFileRoute("/_authenticated/papelera")({
	component: PapeleraPage,
});
