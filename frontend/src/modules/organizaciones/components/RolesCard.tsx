import { Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/core/components/ui/Button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/core/components/ui/Card";
import { ConfirmDialog } from "@/core/components/ui/ConfirmDialog";
import { Dialog } from "@/core/components/ui/Dialog";
import type { RolOrganizacionDto } from "../api/rolesOrganizacionApi";
import {
	useGestionRoles,
	useRolesOrganizacionQuery,
} from "../hooks/useRolesOrganizacion";
import { RolOrganizacionForm } from "./RolOrganizacionForm";

/** Con `roles:gestionar`: roles personalizados de la organización (RN-14). */
export function RolesCard({ organizacionId }: { organizacionId: number }) {
	const { data: roles } = useRolesOrganizacionQuery(organizacionId);
	const { eliminar } = useGestionRoles(organizacionId);
	/** `null` = cerrado; `"nuevo"` = alta; un DTO = edición. */
	const [editando, setEditando] = useState<RolOrganizacionDto | "nuevo" | null>(
		null,
	);
	const [borrando, setBorrando] = useState<RolOrganizacionDto | null>(null);

	return (
		<Card>
			<CardHeader className="flex flex-row items-start justify-between gap-4">
				<div>
					<CardTitle>Roles</CardTitle>
					<CardDescription>
						Opcionales. Dan permisos a los miembros; el administrador ya los
						tiene todos.
					</CardDescription>
				</div>
				<Button size="sm" onClick={() => setEditando("nuevo")}>
					<Plus className="h-4 w-4" />
					Nuevo rol
				</Button>
			</CardHeader>
			<CardContent>
				{roles && roles.length === 0 ? (
					<p className="text-sm text-tinta-tenue">Aún no hay roles.</p>
				) : (
					<ul className="divide-y divide-borde">
						{roles?.map((rol) => (
							<li
								key={rol.id}
								className="flex items-center gap-3 py-2.5 text-sm"
							>
								<div className="min-w-0 flex-1">
									<p className="truncate font-medium text-tinta">
										{rol.nombre}
									</p>
									<p className="text-xs text-tinta-tenue">
										{rol.permisos.length} permisos · {rol.totalMiembros}{" "}
										{rol.totalMiembros === 1 ? "miembro" : "miembros"}
									</p>
								</div>
								<Button
									variant="ghost"
									size="sm"
									aria-label={`Editar el rol ${rol.nombre}`}
									title="Editar"
									onClick={() => setEditando(rol)}
								>
									<Pencil className="h-4 w-4" />
								</Button>
								<Button
									variant="dangerGhost"
									size="sm"
									aria-label={`Eliminar el rol ${rol.nombre}`}
									title="Eliminar"
									onClick={() => setBorrando(rol)}
								>
									<Trash2 className="h-4 w-4" />
								</Button>
							</li>
						))}
					</ul>
				)}
			</CardContent>

			<Dialog
				abierto={editando !== null}
				onCerrar={() => setEditando(null)}
				titulo={editando === "nuevo" ? "Nuevo rol" : "Editar rol"}
			>
				{editando !== null && (
					<RolOrganizacionForm
						key={editando === "nuevo" ? "nuevo" : editando.id}
						organizacionId={organizacionId}
						inicial={editando === "nuevo" ? undefined : editando}
						onGuardado={() => setEditando(null)}
					/>
				)}
			</Dialog>

			<ConfirmDialog
				abierto={borrando !== null}
				titulo={`¿Eliminar el rol «${borrando?.nombre ?? ""}»?`}
				mensaje="Quienes lo tengan perderán sus permisos en el acto."
				textoConfirmar="Eliminar"
				peligroso
				isLoading={eliminar.isPending}
				onCancelar={() => setBorrando(null)}
				onConfirmar={() =>
					borrando &&
					eliminar.mutate(borrando.id, { onSuccess: () => setBorrando(null) })
				}
			/>
		</Card>
	);
}
