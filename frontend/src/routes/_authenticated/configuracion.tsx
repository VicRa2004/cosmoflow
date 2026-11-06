import { createFileRoute } from "@tanstack/react-router";
import { ConfiguracionPage } from "@/modules/configuracion/pages/ConfiguracionPage";

export const Route = createFileRoute("/_authenticated/configuracion")({
	component: ConfiguracionPage,
});
