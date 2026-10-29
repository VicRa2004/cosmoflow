import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { useAuthStore } from "@/core/auth/store";
import { MainLayout } from "@/core/components/layout/MainLayout";

export const Route = createFileRoute("/_authenticated")({
	beforeLoad: ({ location }) => {
		const { isAuthenticated } = useAuthStore.getState();
		if (!isAuthenticated) {
			throw redirect({
				to: "/login",
				// Tras entrar vuelve aquí (p. ej. el enlace de una invitación).
				search: { redirect: location.href },
			});
		}
	},
	component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
	return (
		<MainLayout>
			<Outlet />
		</MainLayout>
	);
}
