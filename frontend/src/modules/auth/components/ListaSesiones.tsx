import { Monitor, Trash2 } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/core/components/ui/Badge";
import { Button } from "@/core/components/ui/Button";
import { ConfirmDialog } from "@/core/components/ui/ConfirmDialog";
import { Spinner } from "@/core/components/ui/Spinner";
import type { SesionDto } from "../api/authApi";
import {
	useRevocarSesionMutation,
	useSesionesQuery,
} from "../hooks/useSesiones";

const formatoFecha = new Intl.DateTimeFormat("es", {
	dateStyle: "medium",
	timeStyle: "short",
});

/** Lista las sesiones activas de la cuenta con revocación individual. */
export function ListaSesiones() {
	const { data: sesiones, isLoading, error } = useSesionesQuery();
	const revocar = useRevocarSesionMutation();
	const [revocando, setRevocando] = useState<SesionDto | null>(null);

	if (isLoading) {
		return (
			<div className="flex justify-center py-4 text-tinta-tenue">
				<Spinner />
			</div>
		);
	}

	if (error) {
		return (
			<p className="text-xs text-tinta-tenue">
				No se pudieron cargar las sesiones activas.
			</p>
		);
	}

	if (!sesiones || sesiones.length === 0) {
		return <p className="text-sm text-tinta-tenue">No hay sesiones activas.</p>;
	}

	return (
		<div className="space-y-3 border-t border-borde pt-4">
			<h3 className="text-sm font-medium text-tinta">
				Sesiones activas ({sesiones.length})
			</h3>
			<ul className="divide-y divide-borde rounded-lg border border-borde bg-fondo">
				{sesiones.map((sesion) => (
					<li
						key={sesion.id}
						className="flex flex-col gap-2 px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between"
					>
						<div className="flex items-start gap-2.5">
							<Monitor className="mt-0.5 h-4 w-4 shrink-0 text-tinta-tenue" />
							<div className="space-y-0.5">
								<div className="flex flex-wrap items-center gap-2">
									<span className="text-sm font-medium text-tinta">
										Sesión #{sesion.id}
									</span>
									{sesion.isActual && (
										<Badge variant="purple">Sesión actual</Badge>
									)}
								</div>
								<p className="text-xs text-tinta-tenue">
									Iniciada: {formatoFecha.format(new Date(sesion.createdAt))} ·
									Caduca: {formatoFecha.format(new Date(sesion.expiraEn))}
								</p>
							</div>
						</div>
						<Button
							variant="dangerGhost"
							size="sm"
							onClick={() => setRevocando(sesion)}
							aria-label={`Cerrar sesión ${sesion.id}`}
						>
							<Trash2 className="h-4 w-4" />
							Cerrar
						</Button>
					</li>
				))}
			</ul>

			<ConfirmDialog
				abierto={revocando !== null}
				titulo={
					revocando?.isActual
						? "¿Cerrar tu sesión actual?"
						: "¿Cerrar esta sesión?"
				}
				mensaje={
					revocando?.isActual
						? "Se cerrará la sesión en este navegador y tendrás que volver a iniciar sesión."
						: "El dispositivo con esta sesión tendrá que volver a iniciar sesión."
				}
				textoConfirmar="Cerrar sesión"
				peligroso
				isLoading={revocar.isPending}
				onCancelar={() => setRevocando(null)}
				onConfirmar={() =>
					revocando &&
					revocar.mutate(revocando, {
						onSuccess: () => setRevocando(null),
					})
				}
			/>
		</div>
	);
}
