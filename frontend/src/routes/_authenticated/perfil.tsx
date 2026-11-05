import { createFileRoute } from "@tanstack/react-router";
import { PerfilLayout } from "@/modules/usuarios/pages/PerfilLayout";

export const Route = createFileRoute("/_authenticated/perfil")({
	component: PerfilLayout,
});
