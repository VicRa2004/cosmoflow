import { createFileRoute } from "@tanstack/react-router";
import { PerfilUsuarioCard } from "@/modules/usuarios/components/PerfilUsuarioCard";

export const Route = createFileRoute("/_authenticated/perfil/general")({
	component: PerfilUsuarioCard,
});
