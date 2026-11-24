import { createFileRoute } from "@tanstack/react-router";
import { DatosCuentaCard } from "@/modules/auth/components/DatosCuentaCard";
import { PerfilUsuarioCard } from "@/modules/usuarios/components/PerfilUsuarioCard";

export const Route = createFileRoute("/_authenticated/perfil/general")({
	component: function GeneralPerfil() {
		return (
			<div className="space-y-6">
				<PerfilUsuarioCard />
				<DatosCuentaCard />
			</div>
		);
	},
});
