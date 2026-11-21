import { Search, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/core/components/ui/Button";
import { EncabezadoPagina } from "@/core/components/ui/EncabezadoPagina";
import { Input } from "@/core/components/ui/Input";
import type { RegistroAuditoria } from "../api/auditoriaApi";
import { AuditoriaDetalleDialog } from "../components/AuditoriaDetalleDialog";
import { AuditoriaTable } from "../components/AuditoriaTable";
import { useAuditoriaQuery } from "../hooks/useAuditoriaQuery";

export function AuditoriaPage() {
	const [pagina, setPagina] = useState(1);
	const [evento, setEvento] = useState("");
	const [usuarioId, setUsuarioId] = useState("");
	const [detalle, setDetalle] = useState<RegistroAuditoria | null>(null);

	const usuarioNumero = usuarioId.trim() ? Number(usuarioId.trim()) : undefined;
	const { data, isLoading, error } = useAuditoriaQuery({
		pagina,
		limite: 20,
		evento: evento.trim() || undefined,
		usuarioId:
			usuarioNumero !== undefined &&
			Number.isInteger(usuarioNumero) &&
			usuarioNumero > 0
				? usuarioNumero
				: undefined,
	});

	const hayFiltros = evento.trim() !== "" || usuarioId.trim() !== "";

	return (
		<div className="space-y-6">
			<EncabezadoPagina
				titulo="Auditoría"
				descripcion="Registro cronológico de eventos del sistema."
			/>

			<div className="flex flex-col gap-2 sm:flex-row sm:items-center">
				<div className="relative w-full sm:w-64">
					<Input
						aria-label="Filtrar por evento"
						placeholder="Filtrar por evento (ej. tarea.creada)..."
						value={evento}
						onChange={(e) => {
							setEvento(e.target.value);
							setPagina(1);
						}}
						className="pl-9"
					/>
					<Search className="pointer-events-none absolute top-2.5 left-3 h-4 w-4 text-tinta-tenue" />
				</div>
				<div className="w-full sm:w-44">
					<Input
						type="number"
						min={1}
						aria-label="Filtrar por ID de usuario"
						placeholder="ID de usuario..."
						value={usuarioId}
						onChange={(e) => {
							setUsuarioId(e.target.value);
							setPagina(1);
						}}
					/>
				</div>
				{hayFiltros && (
					<Button
						variant="ghost"
						size="sm"
						onClick={() => {
							setEvento("");
							setUsuarioId("");
							setPagina(1);
						}}
					>
						<X className="h-4 w-4" />
						Limpiar
					</Button>
				)}
			</div>

			<AuditoriaTable
				pagina={data}
				isLoading={isLoading}
				error={error}
				onCambioPagina={setPagina}
				onVerDetalle={setDetalle}
			/>

			<AuditoriaDetalleDialog
				registro={detalle}
				onCerrar={() => setDetalle(null)}
			/>
		</div>
	);
}
