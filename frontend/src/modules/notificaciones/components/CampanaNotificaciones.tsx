import { useNavigate } from "@tanstack/react-router";
import { Bell, CheckCheck } from "lucide-react";
import { useRef } from "react";
import { Button } from "@/core/components/ui/Button";
import { Spinner } from "@/core/components/ui/Spinner";
import type { NotificacionApp } from "../api/notificacionesApi";
import {
	useBandejaNotificacionesQuery,
	useMarcarNotificacionLeidaMutation,
	useMarcarTodasLeidasMutation,
} from "../hooks/useBandejaNotificaciones";
import { ItemNotificacion } from "./ItemNotificacion";

const ID = "campana-notificaciones";

function rutaDe(notificacion: NotificacionApp): string | null {
	if (notificacion.tipo === "tarea" && notificacion.recursoId) {
		return `/tareas/${notificacion.recursoId}`;
	}
	if (notificacion.tipo === "nota" && notificacion.recursoId) {
		return `/notas/${notificacion.recursoId}`;
	}
	try {
		const url = new URL(notificacion.enlace);
		return `${url.pathname}${url.search}${url.hash}`;
	} catch {
		return notificacion.enlace.startsWith("/") ? notificacion.enlace : null;
	}
}

/** Campana del navbar con contador de no leídas y popover de avisos (#51). */
export function CampanaNotificaciones() {
	const navigate = useNavigate();
	const panel = useRef<HTMLDivElement>(null);
	const { data, isLoading } = useBandejaNotificacionesQuery(20);
	const marcarLeida = useMarcarNotificacionLeidaMutation();
	const marcarTodas = useMarcarTodasLeidasMutation();

	const noLeidas = data?.noLeidas ?? 0;
	const etiquetaContador = noLeidas > 99 ? "99+" : String(noLeidas);

	const abrirNotificacion = (notificacion: NotificacionApp) => {
		if (!notificacion.leida) {
			marcarLeida.mutate(notificacion.id);
		}
		panel.current?.hidePopover();
		const destino = rutaDe(notificacion);
		if (destino) {
			navigate({ to: destino });
		}
	};

	return (
		<>
			<button
				type="button"
				popoverTarget={ID}
				aria-label={
					noLeidas > 0
						? `Notificaciones (${noLeidas} sin leer)`
						: "Notificaciones"
				}
				className="relative inline-flex h-8 w-8 items-center justify-center rounded-md text-tinta-suave transition-colors hover:bg-elevada hover:text-tinta"
			>
				<Bell className="size-4" />
				{noLeidas > 0 && (
					<span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-indigo-600 px-1 text-[10px] font-semibold text-white">
						{etiquetaContador}
					</span>
				)}
			</button>
			<div
				ref={panel}
				id={ID}
				popover="auto"
				className="inset-auto top-13 right-3 m-0 w-80 max-w-[calc(100vw-1.5rem)] rounded-lg border border-borde bg-superficie p-0 text-tinta shadow-flotante sm:w-96"
			>
				<div className="flex items-center justify-between gap-2 border-b border-borde px-3 py-2.5">
					<h2 className="text-sm font-medium text-tinta">Notificaciones</h2>
					{noLeidas > 0 && (
						<Button
							type="button"
							variant="ghost"
							size="sm"
							disabled={marcarTodas.isPending}
							onClick={() => marcarTodas.mutate()}
							className="h-7 px-2 text-xs text-indigo-400"
						>
							<CheckCheck className="h-3.5 w-3.5" />
							Marcar todas
						</Button>
					)}
				</div>
				<div className="max-h-96 overflow-y-auto">
					{isLoading ? (
						<div className="flex justify-center py-8 text-tinta-tenue">
							<Spinner />
						</div>
					) : !data || data.datos.length === 0 ? (
						<p className="px-4 py-8 text-center text-sm text-tinta-tenue">
							No tienes notificaciones todavía.
						</p>
					) : (
						<ul className="divide-y divide-borde">
							{data.datos.map((notificacion) => (
								<li key={notificacion.id}>
									<ItemNotificacion
										notificacion={notificacion}
										onAbrir={() => abrirNotificacion(notificacion)}
									/>
								</li>
							))}
						</ul>
					)}
				</div>
			</div>
		</>
	);
}
