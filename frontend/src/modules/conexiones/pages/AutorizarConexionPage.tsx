import { TriangleAlert } from "lucide-react";
import { useAuthStore } from "@/core/auth/store";
import { Button } from "@/core/components/ui/Button";
import {
	Card,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/core/components/ui/Card";
import { Spinner } from "@/core/components/ui/Spinner";
import {
	useAutorizarConexionMutation,
	useDestinoConexionQuery,
} from "../hooks/useConexion";

interface SolicitudConexion {
	clientId: string;
	redirectUri: string;
	codeChallenge: string;
	state?: string;
}

const PERMISOS = [
	"Ver tus tareas pendientes y tus notas",
	"Crear tareas y notas, y completar tareas",
];

function ErrorSolicitud({ mensaje }: { mensaje: string }) {
	return (
		<Card className="mx-auto max-w-md">
			<CardHeader className="pb-0">
				<CardTitle className="text-lg">No se puede conectar</CardTitle>
				<CardDescription>{mensaje}</CardDescription>
			</CardHeader>
		</Card>
	);
}

/**
 * Pantalla de permiso de OAuth. El destino lo valida el backend antes de mostrarla: nunca
 * se redirige a una dirección que él no haya aceptado, ni siquiera para rechazar.
 */
export function AutorizarConexionPage({
	solicitud,
}: {
	solicitud: SolicitudConexion | null;
}) {
	const usuario = useAuthStore((state) => state.usuario);
	const destino = useDestinoConexionQuery(solicitud?.redirectUri);
	const autorizar = useAutorizarConexionMutation();

	if (!solicitud) {
		return (
			<ErrorSolicitud mensaje="El enlace de conexión está incompleto. Vuelve a la aplicación e inténtalo de nuevo." />
		);
	}
	if (destino.error) {
		return (
			<ErrorSolicitud mensaje="Esta aplicación no está permitida para conectarse con Cosmoflow." />
		);
	}
	if (!destino.data) {
		return (
			<div className="flex justify-center py-12 text-tinta-tenue">
				<Spinner />
			</div>
		);
	}

	const rechazar = () => {
		const url = new URL(solicitud.redirectUri);
		url.searchParams.set("error", "access_denied");
		if (solicitud.state) url.searchParams.set("state", solicitud.state);
		window.location.assign(url.href);
	};

	return (
		<Card className="mx-auto max-w-md space-y-4">
			<CardHeader className="pb-0">
				<CardTitle className="text-lg">
					{destino.data.nombre} quiere conectarse a tu cuenta
				</CardTitle>
				<CardDescription>
					Destino: <strong>{destino.data.host}</strong>. Entrarás como{" "}
					{usuario?.email}.
				</CardDescription>
			</CardHeader>

			{destino.data.esLocal && (
				<p className="flex gap-2 rounded-lg border border-borde p-3 text-sm text-tinta-suave">
					<TriangleAlert className="h-4 w-4 shrink-0 text-amber-500" />
					Permítelo solo si acabas de iniciar esta conexión desde una aplicación
					de este dispositivo, como Claude Code.
				</p>
			)}

			<ul className="list-disc space-y-1 pl-5 text-sm text-tinta-suave">
				{PERMISOS.map((permiso) => (
					<li key={permiso}>{permiso}</li>
				))}
			</ul>
			<p className="text-xs text-tinta-tenue">
				Tendrá tus mismos permisos y la conexión no caduca. Puedes revocarla
				cuando quieras desde tu perfil, en «Conexiones».
			</p>

			<div className="flex justify-end gap-2">
				<Button
					variant="ghost"
					onClick={rechazar}
					disabled={autorizar.isPending}
				>
					Cancelar
				</Button>
				<Button
					onClick={() => autorizar.mutate(solicitud)}
					isLoading={autorizar.isPending}
				>
					Permitir
				</Button>
			</div>
		</Card>
	);
}
