import { Link, Outlet, useNavigate } from "@tanstack/react-router";
import { ListTodo } from "lucide-react";
import { Badge } from "@/core/components/ui/Badge";
import { Button } from "@/core/components/ui/Button";
import { Pestanas, pestanaProps } from "@/core/components/ui/Pestanas";
import { Spinner } from "@/core/components/ui/Spinner";
import { AvatarOrganizacion } from "../components/AvatarOrganizacion";
import { useOrganizacionQuery } from "../hooks/useOrganizacionesQuery";
import { OrganizacionContext } from "../hooks/useOrganizacionActual";
import { puedeEn } from "../utils/permisos";

/** Cabecera y pestañas de una organización; cada sección es su propia página. */
export function OrganizacionLayout({ id }: { id: number }) {
	const navigate = useNavigate();
	const { data, error } = useOrganizacionQuery(id);

	if (error) throw error;
	if (!data) {
		return (
			<div className="flex justify-center py-16 text-tinta-tenue">
				<Spinner />
			</div>
		);
	}

	const secciones = [
		{ to: "/organizaciones/$id/proyectos", etiqueta: "Proyectos" },
		{ to: "/organizaciones/$id/equipos", etiqueta: "Equipos" },
		{ to: "/organizaciones/$id/miembros", etiqueta: "Miembros" },
		{ to: "/organizaciones/$id/estadisticas", etiqueta: "Estadísticas" },
		...(puedeEn(data, "roles:gestionar")
			? [{ to: "/organizaciones/$id/roles", etiqueta: "Roles" } as const]
			: []),
		{ to: "/organizaciones/$id/tags", etiqueta: "Tags" },
		...(puedeEn(data, "organizacion:editar") || data.isAdmin
			? [{ to: "/organizaciones/$id/ajustes", etiqueta: "Ajustes" } as const]
			: []),
	] as const;

	return (
		<div className="mx-auto max-w-3xl space-y-6">
			<header className="flex flex-wrap items-center gap-x-4 gap-y-3">
				<AvatarOrganizacion organizacion={data} className="size-12 text-base" />
				<div className="min-w-0 flex-1 basis-48">
					<h1 className="truncate text-xl font-semibold tracking-tight text-tinta">
						{data.nombre}
					</h1>
					{data.descripcion && (
						<p className="line-clamp-2 text-sm text-tinta-tenue">
							{data.descripcion}
						</p>
					)}
				</div>
				<div className="flex items-center gap-3">
					<Badge variant={data.isAdmin ? "purple" : "default"}>
						{data.isAdmin ? "Administrador" : "Miembro"}
					</Badge>
					<Button
						variant="secondary"
						size="sm"
						onClick={() =>
							navigate({ to: "/tareas", search: { organizacionId: data.id } })
						}
					>
						<ListTodo className="h-4 w-4" />
						Tareas
					</Button>
				</div>
			</header>

			<Pestanas etiqueta="Secciones de la organización">
				{secciones.map(({ to, etiqueta }) => (
					<Link key={to} to={to} params={{ id: String(id) }} {...pestanaProps}>
						{etiqueta}
					</Link>
				))}
			</Pestanas>

			<OrganizacionContext.Provider value={data}>
				<Outlet />
			</OrganizacionContext.Provider>
		</div>
	);
}
