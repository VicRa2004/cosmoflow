import { KeyRound, Shield, User as UserIcon } from "lucide-react";
import type { Usuario } from "@/core/auth/types";
import { Avatar } from "@/core/components/ui/Avatar";
import { Badge } from "@/core/components/ui/Badge";
import { Button } from "@/core/components/ui/Button";
import { EmptyState } from "@/core/components/ui/EmptyState";
import {
	AccionesFila,
	type Columna,
	type Pagina,
	Tabla,
} from "@/core/components/ui/Table";

interface UsuariosTableProps {
	pagina?: Pagina<Usuario>;
	isLoading: boolean;
	error?: unknown;
	onCambioPagina: (pagina: number) => void;
	/** Sin él no se muestra el botón «Permisos» (falta `asignaciones:leer`). */
	onGestionarPermisos?: (usuario: Usuario) => void;
}

const varianteRol = (roles: string[]) =>
	roles.includes("ADMIN")
		? "purple"
		: roles.includes("MOD")
			? "warning"
			: "default";

export function UsuariosTable({
	pagina,
	isLoading,
	error,
	onCambioPagina,
	onGestionarPermisos,
}: UsuariosTableProps) {
	const columnas: Columna<Usuario>[] = [
		{
			cabecera: "ID",
			celda: (u) => `#${u.id}`,
			className: "font-mono text-xs text-tinta-tenue",
		},
		{
			cabecera: "Usuario",
			className: "font-medium text-tinta",
			celda: (u) => (
				<div className="flex items-center gap-2.5">
					<Avatar nombre={u.nombre} url={u.avatarUrl} />
					<span>{u.nombre}</span>
				</div>
			),
		},
		{ cabecera: "Correo", celda: (u) => u.email },
		{
			cabecera: "Rol",
			celda: (u) => (
				<Badge variant={varianteRol(u.roles)} className="gap-1">
					<Shield className="h-3 w-3" />
					{u.roles.join(", ")}
				</Badge>
			),
		},
		{
			cabecera: "Estado",
			celda: (u) => (
				<Badge variant={u.isActivo ? "success" : "danger"}>
					{u.isActivo ? "Activo" : "Inactivo"}
				</Badge>
			),
		},
		...(onGestionarPermisos
			? [
					{
						cabecera: <span className="sr-only">Acciones</span>,
						className: "text-right",
						celda: (u: Usuario) => (
							<AccionesFila>
								<Button
									variant="ghost"
									size="sm"
									onClick={() => onGestionarPermisos(u)}
								>
									<KeyRound className="h-3.5 w-3.5" />
									Permisos
								</Button>
							</AccionesFila>
						),
					},
				]
			: []),
	];

	return (
		<Tabla
			etiqueta="Usuarios"
			columnas={columnas}
			datos={pagina}
			clave={(u) => u.id}
			onCambioPagina={onCambioPagina}
			isLoading={isLoading}
			error={error}
			vacio={
				<EmptyState
					icono={UserIcon}
					titulo="No se encontraron usuarios"
					descripcion="Intenta ajustar los filtros de búsqueda."
				/>
			}
		/>
	);
}
