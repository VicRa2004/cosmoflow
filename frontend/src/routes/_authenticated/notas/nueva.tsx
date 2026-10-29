import { createFileRoute } from "@tanstack/react-router";
import { NotaEditorPage } from "@/modules/notas/pages/NotaEditorPage";

export const Route = createFileRoute("/_authenticated/notas/nueva")({
	component: () => <NotaEditorPage />,
});
