import { createFileRoute, Navigate } from "@tanstack/react-router";
import { z } from "zod";
import { useAuthStore } from "@/core/auth/store";
import { RegistroPage } from "@/modules/auth/pages/RegistroPage";
import { redirectSchema } from "@/modules/auth/schemas/authSchemas";

export const Route = createFileRoute("/registro")({
	validateSearch: z.object({ redirect: redirectSchema }),
	component: RegistroRouteComponent,
});

function RegistroRouteComponent() {
	const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
	const { redirect } = Route.useSearch();

	if (isAuthenticated) {
		return <Navigate to="/dashboard" replace />;
	}

	return <RegistroPage destino={redirect} />;
}
