import { createFileRoute, redirect } from "@tanstack/react-router";
import { useAuthStore } from "@/core/auth/store";
import { UsuariosPage } from "@/modules/usuarios/pages/UsuariosPage";

export const Route = createFileRoute("/_authenticated/usuarios")({
	// Solo administradores, aunque otro rol tenga `usuarios:leer`.
	beforeLoad: () => {
		if (!useAuthStore.getState().usuario?.roles.includes("ADMIN")) {
			throw redirect({ to: "/" });
		}
	},
	component: UsuariosPage,
});
