import {
	Card,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/core/components/ui/Card";
import { Checkbox } from "@/core/components/ui/Checkbox";
import { Spinner } from "@/core/components/ui/Spinner";
import type { PreferenciaNotificacion } from "../api/notificacionesApi";
import {
	useActualizarPreferenciasMutation,
	usePreferenciasNotificacionQuery,
} from "../hooks/usePreferenciasNotificacion";
import { useEstadoTelegramQuery } from "../hooks/useTelegram";
import { VinculoTelegram } from "./VinculoTelegram";

const EVENTOS: Record<PreferenciaNotificacion["evento"], string> = {
	tareaAsignada: "Te asignan una tarea",
	estadoCambiado: "Cambia el estado de una tarea que creaste",
};
const CANALES: Record<PreferenciaNotificacion["canal"], string> = {
	correo: "Correo",
	telegram: "Telegram",
};

/**
 * Qué avisos recibe el usuario y por qué canal; cada casilla se guarda al marcarla.
 * Con `organizacionId`, los valores por defecto de esa organización para sus miembros.
 */
export function PreferenciasNotificacionCard({
	organizacionId,
}: {
	organizacionId?: number;
}) {
	const deOrganizacion = organizacionId !== undefined;
	const { data: preferencias, error } =
		usePreferenciasNotificacionQuery(organizacionId);
	const actualizar = useActualizarPreferenciasMutation(organizacionId);
	const { data: telegram } = useEstadoTelegramQuery();
	// Sin bot en el servidor, Telegram no se muestra.
	const visibles = preferencias?.filter(
		(p) => p.canal !== "telegram" || telegram?.disponible,
	);
	// El usuario no puede activarlo sin vincular; la organización sí (vale para quien lo vincule).
	const bloqueado = (p: PreferenciaNotificacion) =>
		p.canal === "telegram" && !deOrganizacion && !telegram?.vinculado;

	return (
		<Card className="space-y-4">
			<CardHeader className="pb-0">
				<CardTitle className="text-lg">Notificaciones</CardTitle>
				<CardDescription>
					{deOrganizacion
						? "Valores por defecto para los avisos de las tareas de esta organización. Lo que cada miembro elija en su perfil tiene prioridad."
						: "Nunca te avisamos de lo que haces tú."}
				</CardDescription>
			</CardHeader>

			{error ? (
				<p className="text-sm text-rose-400">
					No se pudieron cargar tus preferencias.
				</p>
			) : !visibles ? (
				<div className="flex justify-center py-4 text-tinta-tenue">
					<Spinner />
				</div>
			) : (
				<>
					{!deOrganizacion && telegram?.disponible && (
						<VinculoTelegram vinculado={telegram.vinculado} />
					)}
					<ul className="divide-y divide-borde">
						{Object.entries(EVENTOS).map(([evento, descripcion]) => (
							<li
								key={evento}
								className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between"
							>
								<span className="text-sm text-tinta-suave">
									{descripcion}
									{visibles.some(
										(p) => p.evento === evento && p.personalizado === false,
									) && (
										<span className="block text-xs text-tinta-tenue">
											Sin elegir: en cada organización vale lo que ella decida.
										</span>
									)}
								</span>
								<div className="flex gap-4">
									{visibles
										.filter((p) => p.evento === evento)
										.map((p) => (
											<Checkbox
												key={p.canal}
												label={CANALES[p.canal]}
												checked={p.activo}
												disabled={actualizar.isPending || bloqueado(p)}
												onChange={(e) =>
													actualizar.mutate([
														{ ...p, activo: e.target.checked },
													])
												}
											/>
										))}
								</div>
							</li>
						))}
					</ul>
				</>
			)}
		</Card>
	);
}
