import { createFileRoute, redirect } from "@tanstack/react-router";
import { toast } from "sonner";
import { useAuthStore } from "@/core/auth/store";
import { authApi } from "@/modules/auth/api/authApi";
import { tomarDestinoGoogle } from "@/modules/auth/utils/destinoGoogle";

// Vuelta del login con Google: el backend ya fijó la cookie del refresh token;
// se canjea por la sesión. En beforeLoad (no en un efecto) para que corra una sola
// vez: un segundo /refresh con la misma cookie revocaría la sesión.
export const Route = createFileRoute("/login_/google")({
	beforeLoad: async () => {
		try {
			const sesion = await authApi.sesion();
			useAuthStore.getState().login(sesion);
			toast.success(`¡Bienvenido, ${sesion.usuario.nombre}!`);
		} catch {
			throw redirect({ to: "/login", search: { error: "google" } });
		}
		const destino = tomarDestinoGoogle();
		throw destino ? redirect({ href: destino }) : redirect({ to: "/" });
	},
});
