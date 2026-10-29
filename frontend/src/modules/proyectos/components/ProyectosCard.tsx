import { Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { Badge, type BadgeProps } from "@/core/components/ui/Badge";
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
import { useEquiposQuery } from "@/modules/equipos/hooks/useEquipos";
import type { OrganizacionDto } from "@/modules/organizaciones/api/organizacionesApi";
import { useMiembrosQuery } from "@/modules/organizaciones/hooks/useMiembros";
import { puedeEn } from "@/modules/organizaciones/utils/permisos";
import type { EstadoProyecto, ProyectoDto } from "../api/proyectosApi";
import { useGestionProyectos, useProyectosQuery } from "../hooks/useProyectos";
import { ETIQUETA_ESTADO } from "../schemas/proyectoSchemas";
import { ProyectoForm } from "./ProyectoForm";

const VARIANTE_ESTADO: Record<EstadoProyecto, BadgeProps["variant"]> = {
	activo: "success",
	en_pausa: "warning",
	terminado: "default",
};

/** Proyectos de la organización (RN-30 a 32): todos los ven; crear, editar y borrar según permisos. */
export function ProyectosCard({
	organizacion,
}: {
	organizacion: OrganizacionDto;
}) {
	const organizacionId = organizacion.id;
	const [estado, setEstado] = useState<EstadoProyecto>();
	const { data: proyectos } = useProyectosQuery(organizacionId, estado);
	const { data: equipos = [] } = useEquiposQuery(organizacionId);
	const { data: miembros = [] } = useMiembrosQuery(organizacionId);
	const nombreEquipo = new Map(equipos.map((e) => [e.id, e.nombre]));
	const { eliminar } = useGestionProyectos(organizacionId);
	/** `null` = cerrado; `"nuevo"` = alta; un DTO = edición. */
	const [editando, setEditando] = useState<ProyectoDto | "nuevo" | null>(null);
	const [borrando, setBorrando] = useState<ProyectoDto | null>(null);

	return (
		<Card>
			<CardHeader className="flex flex-row items-start justify-between gap-4">
				<div>
					<CardTitle>Proyectos</CardTitle>
					<CardDescription>
						Cada proyecto tiene al menos un equipo y, si hace falta, integrantes
						sueltos.
					</CardDescription>
				</div>
				{puedeEn(organizacion, "proyectos:crear") && (
					<Button size="sm" onClick={() => setEditando("nuevo")}>
						<Plus className="h-4 w-4" />
						Nuevo proyecto
					</Button>
				)}
			</CardHeader>
			<CardContent className="space-y-4">
				<Select
					label="Filtrar por estado"
					className="sm:w-64"
					value={estado ?? ""}
					onChange={(e) =>
						setEstado((e.target.value || undefined) as EstadoProyecto)
					}
				>
					<option value="">Todos</option>
					{Object.entries(ETIQUETA_ESTADO).map(([valor, etiqueta]) => (
						<option key={valor} value={valor}>
							{etiqueta}
						</option>
					))}
				</Select>
				{proyectos && proyectos.length === 0 ? (
					<p className="text-sm text-tinta-tenue">
						{estado
							? "Ningún proyecto en ese estado."
							: "Aún no hay proyectos."}
					</p>
				) : (
					<ul className="divide-y divide-borde">
						{proyectos?.map((proyecto) => (
							<li
								key={proyecto.id}
								className="flex items-center gap-3 py-2.5 text-sm"
							>
								<div className="min-w-0 flex-1">
									<p className="flex items-center gap-2 font-medium text-tinta">
										<span className="truncate">{proyecto.nombre}</span>
										<Badge variant={VARIANTE_ESTADO[proyecto.estado]}>
											{ETIQUETA_ESTADO[proyecto.estado]}
										</Badge>
									</p>
									<p className="truncate text-xs text-tinta-tenue">
										{proyecto.equipoIds
											.map((id) => nombreEquipo.get(id) ?? "…")
											.join(", ")}
										{proyecto.integranteIds.length > 0 &&
											` · ${proyecto.integranteIds.length} sueltos`}
									</p>
								</div>
								{puedeEn(organizacion, "proyectos:editar") && (
									<Button
										variant="ghost"
										size="sm"
										aria-label={`Editar el proyecto ${proyecto.nombre}`}
										title="Editar"
										onClick={() => setEditando(proyecto)}
									>
										<Pencil className="h-4 w-4" />
									</Button>
								)}
								{puedeEn(organizacion, "proyectos:eliminar") && (
									<Button
										variant="dangerGhost"
										size="sm"
										aria-label={`Eliminar el proyecto ${proyecto.nombre}`}
										title="Eliminar"
										onClick={() => setBorrando(proyecto)}
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
				titulo={editando === "nuevo" ? "Nuevo proyecto" : "Editar proyecto"}
			>
				{editando !== null && (
					<ProyectoForm
						key={editando === "nuevo" ? "nuevo" : editando.id}
						organizacionId={organizacionId}
						inicial={editando === "nuevo" ? undefined : editando}
						equipos={equipos}
						miembros={miembros}
						onGuardado={() => setEditando(null)}
					/>
				)}
			</Dialog>

			<ConfirmDialog
				abierto={borrando !== null}
				titulo={`¿Eliminar el proyecto «${borrando?.nombre ?? ""}»?`}
				mensaje="Sus equipos e integrantes siguen en la organización."
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
