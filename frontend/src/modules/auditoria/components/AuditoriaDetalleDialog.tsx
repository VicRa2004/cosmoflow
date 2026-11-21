import { Dialog } from "@/core/components/ui/Dialog";
import type { RegistroAuditoria } from "../api/auditoriaApi";

const formatoFecha = new Intl.DateTimeFormat("es", {
	dateStyle: "medium",
	timeStyle: "medium",
});

/** Modal con la información completa de un registro de auditoría. */
export function AuditoriaDetalleDialog({
	registro,
	onCerrar,
}: {
	registro: RegistroAuditoria | null;
	onCerrar: () => void;
}) {
	return (
		<Dialog
			abierto={registro !== null}
			onCerrar={onCerrar}
			titulo={registro ? `Evento: ${registro.evento}` : "Detalle de auditoría"}
			descripcion={
				registro
					? `${formatoFecha.format(new Date(registro.ocurridoEn))} · Registro #${registro.id}`
					: undefined
			}
			className="max-w-2xl"
		>
			{registro && (
				<div className="space-y-4">
					<dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-sm">
						<dt className="text-tinta-tenue">Usuario</dt>
						<dd className="text-tinta">
							{registro.usuarioId !== null
								? `#${registro.usuarioId}`
								: "Sistema"}
						</dd>
						<dt className="text-tinta-tenue">Request ID</dt>
						<dd className="font-mono text-xs text-tinta-suave">
							{registro.requestId ?? "—"}
						</dd>
					</dl>

					<div className="space-y-1.5">
						<p className="text-xs font-medium text-tinta-suave">Datos</p>
						<pre className="max-h-80 overflow-auto rounded-md border border-borde bg-fondo p-3 font-mono text-xs text-tinta-suave">
							{JSON.stringify(registro.datos, null, 2)}
						</pre>
					</div>
				</div>
			)}
		</Dialog>
	);
}
