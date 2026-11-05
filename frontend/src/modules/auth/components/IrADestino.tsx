import { Navigate, useRouter } from "@tanstack/react-router";
import { useEffect } from "react";

/**
 * Para las rutas públicas cuando ya hay sesión. También corre justo tras entrar: sin
 * respetar `destino`, ganaría la carrera al del formulario y este se perdería.
 */
export function IrADestino({ destino }: { destino?: string }) {
	const router = useRouter();

	useEffect(() => {
		if (destino) router.history.replace(destino);
	}, [router, destino]);

	return destino ? null : <Navigate to="/dashboard" replace />;
}
