import { createFileRoute } from "@tanstack/react-router";
import { CambiarPasswordForm } from "@/modules/auth/components/CambiarPasswordForm";
import { SeguridadCuentaCard } from "@/modules/auth/components/SeguridadCuentaCard";

export const Route = createFileRoute("/_authenticated/perfil/seguridad")({
	component: function SeguridadPerfil() {
		return (
			<div className="space-y-6">
				<SeguridadCuentaCard />
				<CambiarPasswordForm />
			</div>
		);
	},
});
