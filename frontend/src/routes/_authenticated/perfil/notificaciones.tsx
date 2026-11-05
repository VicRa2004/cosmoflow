import { createFileRoute } from "@tanstack/react-router";
import { PreferenciasNotificacionCard } from "@/modules/notificaciones/components/PreferenciasNotificacionCard";

export const Route = createFileRoute("/_authenticated/perfil/notificaciones")({
	component: PreferenciasNotificacionCard,
});
