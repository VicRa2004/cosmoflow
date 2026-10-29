import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { InvitacionPage } from "@/modules/organizaciones/pages/InvitacionPage";

// Protegida: sin sesión, el guardián manda a /login y vuelve aquí tras entrar o registrarse.
export const Route = createFileRoute("/_authenticated/invitacion")({
	validateSearch: z.object({ token: z.string().catch("") }),
	component: function Invitacion() {
		const { token } = Route.useSearch();
		return <InvitacionPage key={token} token={token} />;
	},
});
