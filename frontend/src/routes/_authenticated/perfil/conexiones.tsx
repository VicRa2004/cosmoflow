import { createFileRoute } from "@tanstack/react-router";
import { TokensPersonalesCard } from "@/modules/auth/components/TokensPersonalesCard";
import { ConectarClaudeCard } from "@/modules/conexiones/components/ConectarClaudeCard";

export const Route = createFileRoute("/_authenticated/perfil/conexiones")({
	component: function ConexionesPerfil() {
		return (
			<div className="space-y-6">
				<ConectarClaudeCard />
				<TokensPersonalesCard />
			</div>
		);
	},
});
