import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useAuthStore } from "@/core/auth/store";
import { usePermisos } from "@/core/auth/usePermisos";
import { NAVEGACION } from "@/core/components/layout/navegacion";
import { Spinner } from "@/core/components/ui/Spinner";

export const Route = createFileRoute("/")({
	component: IndexComponent,
});

function IndexComponent() {
	const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

	if (!isAuthenticated) return <Navigate to="/login" replace />;
	return <PrimeraSeccion />;
}

/** Aterriza en la primera sección del menú que el usuario puede ver; si no tiene ninguna, en su perfil. */
function PrimeraSeccion() {
	const { puede, listo } = usePermisos();

	if (!listo) {
		return (
			<div className="flex min-h-screen items-center justify-center">
				<Spinner size="lg" className="text-tinta-tenue" />
			</div>
		);
	}
	const primera = NAVEGACION.flatMap((grupo) => grupo.items).find((item) =>
		puede(item.permiso),
	);
	return <Navigate to={primera?.to ?? "/perfil"} replace />;
}
