import { useState } from "react";
import { useUsuariosQuery } from "../hooks/useUsuariosQuery";
import { UsuariosTable } from "../components/UsuariosTable";
import { Input } from "@/core/components/ui/Input";
import type { Usuario } from "@/core/auth/types";
import { AsignacionUsuarioPanel } from "@/modules/roles/components/AsignacionUsuarioPanel";
import { Search } from "lucide-react";
import { usePermisos } from "@/core/auth/usePermisos";
import { EncabezadoPagina } from "@/core/components/ui/EncabezadoPagina";

export function UsuariosPage() {
	const [pagina, setPagina] = useState(1);
	const [emailBusqueda, setEmailBusqueda] = useState("");
	const [seleccionado, setSeleccionado] = useState<Usuario | null>(null);
	const { puede } = usePermisos();

	const { data, isLoading, error } = useUsuariosQuery({
		pagina,
		limite: 5,
		email: emailBusqueda.trim() ? emailBusqueda.trim() : undefined,
	});

	return (
		<div className="space-y-6">
			<EncabezadoPagina
				titulo="Usuarios"
				descripcion="Consulta y administra los usuarios registrados en el sistema."
			>
				<div className="w-full sm:w-72">
					<div className="relative">
						<Input
							type="text"
							placeholder="Buscar por email..."
							value={emailBusqueda}
							onChange={(e) => {
								setEmailBusqueda(e.target.value);
								setPagina(1); // Reset a primera página al buscar
							}}
							className="pl-9"
						/>
						<Search className="absolute left-3 top-2.5 h-4 w-4 text-tinta-tenue pointer-events-none" />
					</div>
				</div>
			</EncabezadoPagina>

			{/* Tabla de Usuarios con TanStack Query */}
			<UsuariosTable
				pagina={data}
				isLoading={isLoading}
				error={error}
				onCambioPagina={setPagina}
				onGestionarPermisos={
					puede("asignaciones:leer") ? setSeleccionado : undefined
				}
			/>

			<AsignacionUsuarioPanel
				key={seleccionado?.id}
				usuario={seleccionado}
				onCerrar={() => setSeleccionado(null)}
			/>
		</div>
	);
}
