import { Link, useNavigate } from "@tanstack/react-router";
import { Building2, Plus, Search } from "lucide-react";
import { useState } from "react";
import { usePermisos } from "@/core/auth/usePermisos";
import { Button } from "@/core/components/ui/Button";
import { Dialog } from "@/core/components/ui/Dialog";
import { EmptyState } from "@/core/components/ui/EmptyState";
import { EncabezadoPagina } from "@/core/components/ui/EncabezadoPagina";
import { Input } from "@/core/components/ui/Input";
import { Spinner } from "@/core/components/ui/Spinner";
import { Paginacion } from "@/core/components/ui/Table";
import { AvatarOrganizacion } from "../components/AvatarOrganizacion";
import { OrganizacionForm } from "../components/OrganizacionForm";
import { useOrganizacionesQuery } from "../hooks/useOrganizacionesQuery";

/** Las organizaciones de las que soy miembro; se entra en una para verla o configurarla. */
export function OrganizacionesPage() {
	const { puede } = usePermisos();
	const navigate = useNavigate();
	const [pagina, setPagina] = useState(1);
	const [busqueda, setBusqueda] = useState("");
	const [creando, setCreando] = useState(false);
	const { data, isLoading, error } = useOrganizacionesQuery({
		pagina,
		limite: 12,
		nombre: busqueda.trim() || undefined,
	});

	if (error) throw error;

	return (
		<div className="space-y-6">
			<EncabezadoPagina titulo="Organizaciones">
				<div className="relative w-full sm:w-64">
					<Input
						aria-label="Buscar por nombre"
						placeholder="Buscar por nombre..."
						value={busqueda}
						onChange={(e) => {
							setBusqueda(e.target.value);
							setPagina(1);
						}}
						className="pl-9"
					/>
					<Search className="pointer-events-none absolute top-2.5 left-3 h-4 w-4 text-tinta-tenue" />
				</div>
				{puede("organizaciones:crear") && (
					<Button onClick={() => setCreando(true)}>
						<Plus className="h-4 w-4" />
						Nueva
					</Button>
				)}
			</EncabezadoPagina>

			{isLoading || !data ? (
				<div className="flex justify-center py-16 text-tinta-tenue">
					<Spinner />
				</div>
			) : data.datos.length === 0 ? (
				<EmptyState
					icono={Building2}
					titulo={
						busqueda ? "Sin resultados" : "Aún no estás en ninguna organización"
					}
					descripcion={
						busqueda
							? undefined
							: "Crea una para trabajar con otras personas en equipos y proyectos."
					}
				/>
			) : (
				<>
					<ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
						{data.datos.map((organizacion) => (
							<li key={organizacion.id}>
								<Link
									to="/organizaciones/$id"
									params={{ id: String(organizacion.id) }}
									className="flex h-full items-start gap-3 rounded-lg border border-borde bg-superficie p-4 transition-colors hover:border-borde-fuerte hover:bg-elevada"
								>
									<AvatarOrganizacion
										organizacion={organizacion}
										className="size-10 text-sm"
									/>
									<div className="min-w-0">
										<p className="truncate font-medium text-tinta">
											{organizacion.nombre}
										</p>
										<p className="line-clamp-2 text-sm text-tinta-tenue">
											{organizacion.descripcion ||
												(organizacion.isAdmin ? "Administrador" : "Miembro")}
										</p>
									</div>
								</Link>
							</li>
						))}
					</ul>
					<Paginacion
						pagina={data.pagina}
						totalPaginas={data.totalPaginas}
						totalElementos={data.totalElementos}
						onCambioPagina={setPagina}
					/>
				</>
			)}

			<Dialog
				abierto={creando}
				onCerrar={() => setCreando(false)}
				titulo="Nueva organización"
			>
				{creando && (
					<OrganizacionForm
						onGuardado={({ id }) => {
							setCreando(false);
							navigate({
								to: "/organizaciones/$id",
								params: { id: String(id) },
							});
						}}
					/>
				)}
			</Dialog>
		</div>
	);
}
