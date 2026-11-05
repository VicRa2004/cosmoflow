import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { useAuthStore } from "@/core/auth/store";
import { IrADestino } from "@/modules/auth/components/IrADestino";
import { LoginPage } from "@/modules/auth/pages/LoginPage";
import { redirectSchema } from "@/modules/auth/schemas/authSchemas";

export const Route = createFileRoute("/login")({
	// `?error=google`: el login con Google falló o no está configurado.
	validateSearch: z.object({
		error: z.string().optional().catch(undefined),
		redirect: redirectSchema,
	}),
	component: LoginRouteComponent,
});

function LoginRouteComponent() {
	const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
	const { error, redirect } = Route.useSearch();

	if (isAuthenticated) {
		return <IrADestino destino={redirect} />;
	}

	return <LoginPage errorGoogle={error === "google"} destino={redirect} />;
}
