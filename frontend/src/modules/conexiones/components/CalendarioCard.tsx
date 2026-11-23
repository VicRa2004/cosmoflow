import { CalendarSync } from "lucide-react";
import { useState } from "react";
import { BotonCopiar } from "@/core/components/ui/BotonCopiar";
import { Button } from "@/core/components/ui/Button";
import {
	Card,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/core/components/ui/Card";
import { ConfirmDialog } from "@/core/components/ui/ConfirmDialog";
import { Spinner } from "@/core/components/ui/Spinner";
import {
	useGenerarCalendarioMutation,
	useRevocarCalendarioMutation,
	useSuscripcionCalendarioQuery,
} from "../hooks/useCalendario";

/** URL iCalendar para ver los pendientes en Google Calendar, Outlook o el móvil. */
export function CalendarioCard() {
	const { data, isLoading } = useSuscripcionCalendarioQuery();
	const generar = useGenerarCalendarioMutation();
	const revocar = useRevocarCalendarioMutation();
	const [confirmar, setConfirmar] = useState<"regenerar" | "desactivar" | null>(
		null,
	);
	const url = generar.data;

	return (
		<Card className="space-y-4">
			<CardHeader className="pb-0">
				<CardTitle className="flex items-center gap-2 text-lg">
					<CalendarSync className="size-5" aria-hidden />
					Calendario externo
				</CardTitle>
				<CardDescription>
					Tus pendientes con fecha aparecen en Google Calendar, Outlook o el
					calendario del móvil, en su día de vencimiento (o de inicio). Se
					actualiza solo, cada pocas horas según la app.
				</CardDescription>
			</CardHeader>

			{isLoading ? (
				<Spinner size="sm" />
			) : url ? (
				<div className="space-y-3 rounded-lg border border-borde p-4">
					<p className="text-sm font-medium text-tinta-suave" role="status">
						Copia la dirección ahora: no se volverá a mostrar. Quien la tenga
						puede ver tus pendientes.
					</p>
					<div className="flex items-center gap-2">
						<code className="min-w-0 flex-1 break-all rounded-md bg-elevada p-2 font-mono text-xs select-all">
							{url}
						</code>
						<BotonCopiar texto={url} />
					</div>
					<p className="text-xs text-tinta-tenue">
						En Google Calendar:{" "}
						<strong>Otros calendarios → + → Desde URL</strong>. En Outlook:{" "}
						<strong>Agregar calendario → Suscribirse desde web</strong>.
					</p>
				</div>
			) : data?.activa ? (
				<p className="text-sm text-tinta-suave">
					Activo desde el {new Date(data.creadaEn ?? "").toLocaleDateString()}.
					Si perdiste la dirección, genera otra: la anterior dejará de
					funcionar.
				</p>
			) : null}

			<div className="flex flex-wrap gap-2">
				<Button
					size="sm"
					isLoading={generar.isPending}
					onClick={() =>
						data?.activa ? setConfirmar("regenerar") : generar.mutate()
					}
				>
					{data?.activa ? "Generar nueva dirección" : "Activar"}
				</Button>
				{data?.activa && (
					<Button
						size="sm"
						variant="dangerGhost"
						onClick={() => setConfirmar("desactivar")}
					>
						Desactivar
					</Button>
				)}
			</div>

			<ConfirmDialog
				abierto={confirmar !== null}
				titulo={
					confirmar === "regenerar"
						? "¿Generar una dirección nueva?"
						: "¿Desactivar el calendario?"
				}
				mensaje="La dirección actual dejará de funcionar en los calendarios donde la hayas añadido."
				textoConfirmar={confirmar === "regenerar" ? "Generar" : "Desactivar"}
				peligroso
				isLoading={generar.isPending || revocar.isPending}
				onCancelar={() => setConfirmar(null)}
				onConfirmar={() => {
					const onSettled = () => setConfirmar(null);
					if (confirmar === "regenerar")
						generar.mutate(undefined, { onSettled });
					else
						revocar.mutate(undefined, {
							onSuccess: () => generar.reset(),
							onSettled,
						});
				}}
			/>
		</Card>
	);
}
