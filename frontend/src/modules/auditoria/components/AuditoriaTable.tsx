import { Eye } from "lucide-react";
import { Badge } from "@/core/components/ui/Badge";
import { Button } from "@/core/components/ui/Button";
import {
	AccionesFila,
	type Columna,
	type Pagina,
	Tabla,
} from "@/core/components/ui/Table";
import type { RegistroAuditoria } from "../api/auditoriaApi";

const formatoFecha = new Intl.DateTimeFormat("es", {
	dateStyle: "short",
	timeStyle: "medium",
});

interface AuditoriaTableProps {
	pagina?: Pagina<RegistroAuditoria>;
	isLoading: boolean;
	error?: unknown;
	onCambioPagina: (pagina: number) => void;
	onVerDetalle: (registro: RegistroAuditoria) => void;
}

export function AuditoriaTable({
	pagina,
	isLoading,
	error,
	onCambioPagina,
	onVerDetalle,
}: AuditoriaTableProps) {
	const columnas: Columna<RegistroAuditoria>[] = [
		{
			cabecera: "Fecha",
			celda: (fila) => (
				<span className="whitespace-nowrap text-xs text-tinta-suave">
					{formatoFecha.format(new Date(fila.ocurridoEn))}
				</span>
			),
		},
		{
			cabecera: "Evento",
			celda: (fila) => <Badge variant="purple">{fila.evento}</Badge>,
		},
		{
			cabecera: "Usuario",
			celda: (fila) =>
				fila.usuarioId !== null ? (
					<span className="font-mono text-xs">#{fila.usuarioId}</span>
				) : (
					<span className="text-xs text-tinta-tenue">Sistema</span>
				),
		},
		{
			cabecera: "Petición",
			celda: (fila) =>
				fila.requestId ? (
					<span
						title={fila.requestId}
						className="inline-block max-w-36 truncate font-mono text-xs text-tinta-tenue"
					>
						{fila.requestId}
					</span>
				) : (
					<span className="text-xs text-tinta-tenue">—</span>
				),
		},
		{
			cabecera: <span className="sr-only">Acciones</span>,
			className: "text-right",
			celda: (fila) => (
				<AccionesFila>
					<Button
						variant="ghost"
						size="sm"
						onClick={() => onVerDetalle(fila)}
						aria-label="Ver detalle"
					>
						<Eye className="mr-1.5 h-4 w-4" />
						Ver detalle
					</Button>
				</AccionesFila>
			),
		},
	];

	return (
		<Tabla
			etiqueta="Registro de auditoría"
			columnas={columnas}
			datos={pagina}
			clave={(fila) => fila.id}
			onCambioPagina={onCambioPagina}
			isLoading={isLoading}
			error={error}
		/>
	);
}
