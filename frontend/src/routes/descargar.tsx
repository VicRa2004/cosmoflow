import { createFileRoute } from "@tanstack/react-router";
import { DescargasPage } from "@/modules/descargas/pages/DescargasPage";

// Pública: se enlaza desde el login y desde el menú de usuario.
export const Route = createFileRoute("/descargar")({
	component: DescargasPage,
});
