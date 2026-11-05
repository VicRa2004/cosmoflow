import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { AutorizarConexionPage } from "@/modules/conexiones/pages/AutorizarConexionPage";

// Todo opcional: un enlace mal formado se muestra como error, no como 404.
const texto = z.string().optional().catch(undefined);

/** Endpoint de autorización OAuth: sin sesión, el guardián pasa por /login y vuelve aquí. */
export const Route = createFileRoute("/_authenticated/autorizar-conexion")({
	validateSearch: z.object({
		response_type: texto,
		client_id: texto,
		redirect_uri: texto,
		code_challenge: texto,
		code_challenge_method: texto,
		state: texto,
	}),
	component: function AutorizarConexion() {
		const {
			response_type,
			client_id: clientId,
			redirect_uri: redirectUri,
			code_challenge: codeChallenge,
			code_challenge_method,
			state,
		} = Route.useSearch();
		const completa =
			response_type === "code" &&
			code_challenge_method === "S256" &&
			clientId &&
			redirectUri &&
			codeChallenge;
		return (
			<AutorizarConexionPage
				solicitud={
					completa ? { clientId, redirectUri, codeChallenge, state } : null
				}
			/>
		);
	},
});
