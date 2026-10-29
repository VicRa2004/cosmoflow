import { createFileRoute, Navigate } from "@tanstack/react-router";
import { z } from "zod";
import { useAuthStore } from "@/core/auth/store";
import { LoginPage } from "@/modules/auth/pages/LoginPage";

export const Route = createFileRoute("/login")({
	// `?error=google`: el login con Google falló o no está configurado.
	validateSearch: z.object({ error: z.string().optional().catch(undefined) }),
	component: LoginRouteComponent,
});

function LoginRouteComponent() {
	const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
	const { error } = Route.useSearch();

	if (isAuthenticated) {
		return <Navigate to="/dashboard" replace />;
	}

	return <LoginPage errorGoogle={error === "google"} />;
}
