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

const EVENTOS: Record<PreferenciaNotificacion["evento"], string> = {
	tareaAsignada: "Te asignan una tarea",
	estadoCambiado: "Cambia el estado de una tarea que creaste",
};
const CANALES: Record<PreferenciaNotificacion["canal"], string> = {
	correo: "Correo",
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
			) : !preferencias ? (
				<div className="flex justify-center py-4 text-tinta-tenue">
					<Spinner />
				</div>
			) : (
				<ul className="divide-y divide-borde">
					{Object.entries(EVENTOS).map(([evento, descripcion]) => (
						<li
							key={evento}
							className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between"
						>
							<span className="text-sm text-tinta-suave">
								{descripcion}
								{preferencias.some(
									(p) => p.evento === evento && p.personalizado === false,
								) && (
									<span className="block text-xs text-tinta-tenue">
										Sin elegir: en cada organización vale lo que ella decida.
									</span>
								)}
							</span>
							<div className="flex gap-4">
								{preferencias
									.filter((p) => p.evento === evento)
									.map((p) => (
										<Checkbox
											key={p.canal}
											label={CANALES[p.canal]}
											checked={p.activo}
											disabled={actualizar.isPending}
											onChange={(e) =>
												actualizar.mutate([{ ...p, activo: e.target.checked }])
											}
										/>
									))}
							</div>
						</li>
					))}
				</ul>
			)}
		</Card>
	);
}
