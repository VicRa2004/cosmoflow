import { Link } from "@tanstack/react-router";
import { ChevronRight, Plus } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/core/components/ui/Badge";
import { Button } from "@/core/components/ui/Button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/core/components/ui/Card";
import { Dialog } from "@/core/components/ui/Dialog";
import { Select } from "@/core/components/ui/Select";
import { Paginacion, paginarLista } from "@/core/components/ui/Table";
import type { OrganizacionDto } from "@/modules/organizaciones/api/organizacionesApi";
import { AvatarOrganizacion } from "@/modules/organizaciones/components/AvatarOrganizacion";
import { useMiembrosQuery } from "@/modules/organizaciones/hooks/useMiembros";
import { puedeEn } from "@/modules/organizaciones/utils/permisos";
import { useTagsQuery } from "@/modules/tags/hooks/useTagsQuery";
import { useEquiposQuery } from "../hooks/useEquipos";
import { EquipoForm } from "./EquipoForm";

/** Lista de equipos (RN-20 a 26): todos los ven; cada uno se gestiona en su página (`EquipoPage`). */
export function EquiposCard({
	organizacion,
}: {
	organizacion: OrganizacionDto;
}) {
	const organizacionId = organizacion.id;
	const [tagId, setTagId] = useState<number>();
	const { data: equipos } = useEquiposQuery(organizacionId, tagId);
	const [pagina, setPagina] = useState(1);
	const paginaEquipos = paginarLista(equipos ?? [], pagina);
	const { data: miembros = [] } = useMiembrosQuery(organizacionId);
	// shortcut: los 100 primeros tags; paginar si una organización tiene más.
	const { data: paginaTags } = useTagsQuery(
		{ pagina: 1, limite: 100 },
		organizacionId,
	);
	const tags = paginaTags?.datos ?? [];
	const nombreMiembro = new Map(miembros.map((m) => [m.usuarioId, m.nombre]));
	const nombreTag = new Map(tags.map((t) => [t.id, t.nombre]));
	const [creando, setCreando] = useState(false);

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
					<Button
						size="sm"
						className="shrink-0"
						onClick={() => setCreando(true)}
					>
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
						onChange={(e) => {
							setTagId(e.target.value ? Number(e.target.value) : undefined);
							setPagina(1);
						}}
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
						{paginaEquipos.datos.map((equipo) => (
							<li key={equipo.id}>
								<Link
									to="/organizaciones/$id/equipos/$equipoId"
									params={{
										id: String(organizacionId),
										equipoId: String(equipo.id),
									}}
									className="flex items-center gap-3 py-2.5 text-sm hover:bg-elevada/50"
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
									<ChevronRight
										aria-hidden
										className="size-4 shrink-0 text-tinta-tenue"
									/>
								</Link>
							</li>
						))}
					</ul>
				)}
				{paginaEquipos.totalPaginas > 1 && (
					<Paginacion {...paginaEquipos} onCambioPagina={setPagina} />
				)}
			</CardContent>

			<Dialog
				abierto={creando}
				onCerrar={() => setCreando(false)}
				titulo="Nuevo equipo"
			>
				{creando && (
					<EquipoForm
						organizacionId={organizacionId}
						miembros={miembros}
						tags={tags}
						onGuardado={() => setCreando(false)}
					/>
				)}
			</Dialog>
		</Card>
	);
}
