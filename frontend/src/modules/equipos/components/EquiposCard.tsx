import { Pencil, Plus, Trash2, UserCog } from "lucide-react";
import { useState } from "react";
import { useAuthStore } from "@/core/auth/store";
import { Badge } from "@/core/components/ui/Badge";
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
import { Select } from "@/core/components/ui/Select";
import type { OrganizacionDto } from "@/modules/organizaciones/api/organizacionesApi";
import { AvatarOrganizacion } from "@/modules/organizaciones/components/AvatarOrganizacion";
import { useMiembrosQuery } from "@/modules/organizaciones/hooks/useMiembros";
import { puedeEn } from "@/modules/organizaciones/utils/permisos";
import { useTagsQuery } from "@/modules/tags/hooks/useTagsQuery";
import type { EquipoDto } from "../api/equiposApi";
import { useEquiposQuery, useGestionEquipos } from "../hooks/useEquipos";
import { DelegadosForm } from "./DelegadosForm";
import { EquipoForm } from "./EquipoForm";

/** Equipos de la organización (RN-20 a 26): todos los ven; crear, editar y borrar según permisos. */
export function EquiposCard({
	organizacion,
}: {
	organizacion: OrganizacionDto;
}) {
	const organizacionId = organizacion.id;
	const yo = useAuthStore((state) => state.usuario?.id);
	const [tagId, setTagId] = useState<number>();
	const { data: equipos } = useEquiposQuery(organizacionId, tagId);
	const { data: miembros = [] } = useMiembrosQuery(organizacionId);
	// shortcut: los 100 primeros tags; paginar si una organización tiene más.
	const { data: paginaTags } = useTagsQuery(
		{ pagina: 1, limite: 100 },
		organizacionId,
	);
	const tags = paginaTags?.datos ?? [];
	const nombreMiembro = new Map(miembros.map((m) => [m.usuarioId, m.nombre]));
	const nombreTag = new Map(tags.map((t) => [t.id, t.nombre]));
	const { eliminar } = useGestionEquipos(organizacionId);
	/** `null` = cerrado; `"nuevo"` = alta; un DTO = edición. */
	const [editando, setEditando] = useState<EquipoDto | "nuevo" | null>(null);
	const [delegando, setDelegando] = useState<EquipoDto | null>(null);
	const [borrando, setBorrando] = useState<EquipoDto | null>(null);
	const puedeEditar = puedeEn(organizacion, "equipos:editar");

	return (
		<Card>
			<CardHeader className="flex flex-row items-start justify-between gap-4">
				<div>
					<CardTitle>Equipos</CardTitle>
					<CardDescription>
						Al menos 2 miembros. Con líder, solo él y sus delegados crean
						tareas.
					</CardDescription>
				</div>
				{puedeEn(organizacion, "equipos:crear") && (
					<Button size="sm" onClick={() => setEditando("nuevo")}>
						<Plus className="h-4 w-4" />
						Nuevo equipo
					</Button>
				)}
			</CardHeader>
			<CardContent className="space-y-4">
				{tags.length > 0 && (
					<Select
						label="Filtrar por tag"
						className="sm:w-64"
						value={tagId ?? ""}
						onChange={(e) =>
							setTagId(e.target.value ? Number(e.target.value) : undefined)
						}
					>
						<option value="">Todos</option>
						{tags.map((t) => (
							<option key={t.id} value={t.id}>
								{t.nombre}
							</option>
						))}
					</Select>
				)}
				{equipos && equipos.length === 0 ? (
					<p className="text-sm text-tinta-tenue">
						{tagId ? "Ningún equipo con ese tag." : "Aún no hay equipos."}
					</p>
				) : (
					<ul className="divide-y divide-borde">
						{equipos?.map((equipo) => (
							<li
								key={equipo.id}
								className="flex items-center gap-3 py-2.5 text-sm"
							>
								<AvatarOrganizacion
									organizacion={{ ...equipo, avatarUrl: null }}
								/>
								<div className="min-w-0 flex-1">
									<p className="truncate font-medium text-tinta">
										{equipo.nombre}
									</p>
									<p className="truncate text-xs text-tinta-tenue">
										{equipo.miembros.length} miembros
										{equipo.liderId !== null &&
											` · Líder: ${nombreMiembro.get(equipo.liderId) ?? "—"}`}
									</p>
									{equipo.tagIds.length > 0 && (
										<div className="mt-1 flex flex-wrap gap-1">
											{equipo.tagIds.map((id) => (
												<Badge key={id}>{nombreTag.get(id) ?? "…"}</Badge>
											))}
										</div>
									)}
								</div>
								{equipo.liderId !== null &&
									(equipo.liderId === yo || puedeEditar) && (
										<Button
											variant="ghost"
											size="sm"
											aria-label={`Delegados de ${equipo.nombre}`}
											title="Delegados"
											onClick={() => setDelegando(equipo)}
										>
											<UserCog className="h-4 w-4" />
										</Button>
									)}
								{puedeEditar && (
									<Button
										variant="ghost"
										size="sm"
										aria-label={`Editar el equipo ${equipo.nombre}`}
										title="Editar"
										onClick={() => setEditando(equipo)}
									>
										<Pencil className="h-4 w-4" />
									</Button>
								)}
								{puedeEn(organizacion, "equipos:eliminar") && (
									<Button
										variant="dangerGhost"
										size="sm"
										aria-label={`Eliminar el equipo ${equipo.nombre}`}
										title="Eliminar"
										onClick={() => setBorrando(equipo)}
									>
										<Trash2 className="h-4 w-4" />
									</Button>
								)}
							</li>
						))}
					</ul>
				)}
			</CardContent>

			<Dialog
				abierto={editando !== null}
				onCerrar={() => setEditando(null)}
				titulo={editando === "nuevo" ? "Nuevo equipo" : "Editar equipo"}
			>
				{editando !== null && (
					<EquipoForm
						key={editando === "nuevo" ? "nuevo" : editando.id}
						organizacionId={organizacionId}
						inicial={editando === "nuevo" ? undefined : editando}
						miembros={miembros}
						tags={tags}
						onGuardado={() => setEditando(null)}
					/>
				)}
			</Dialog>

			<Dialog
				abierto={delegando !== null}
				onCerrar={() => setDelegando(null)}
				titulo={`Delegados de «${delegando?.nombre ?? ""}»`}
			>
				{delegando !== null && (
					<DelegadosForm
						key={delegando.id}
						organizacionId={organizacionId}
						equipo={delegando}
						nombre={nombreMiembro}
						onGuardado={() => setDelegando(null)}
					/>
				)}
			</Dialog>

			<ConfirmDialog
				abierto={borrando !== null}
				titulo={`¿Eliminar el equipo «${borrando?.nombre ?? ""}»?`}
				mensaje="Sus miembros siguen en la organización."
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
