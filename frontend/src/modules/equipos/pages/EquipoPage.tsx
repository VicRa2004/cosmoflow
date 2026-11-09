import { Link, useNavigate } from "@tanstack/react-router";
import {
	ArrowLeft,
	ListTodo,
	Pencil,
	Trash2,
	UserCog,
	Users,
} from "lucide-react";
import { useState } from "react";
import { useAuthStore } from "@/core/auth/store";
import { Avatar } from "@/core/components/ui/Avatar";
import { Badge } from "@/core/components/ui/Badge";
import { Button } from "@/core/components/ui/Button";
import { Card, CardHeader, CardTitle } from "@/core/components/ui/Card";
import { ConfirmDialog } from "@/core/components/ui/ConfirmDialog";
import { Dialog } from "@/core/components/ui/Dialog";
import { EmptyState } from "@/core/components/ui/EmptyState";
import { Spinner } from "@/core/components/ui/Spinner";
import type { OrganizacionDto } from "@/modules/organizaciones/api/organizacionesApi";
import { AvatarOrganizacion } from "@/modules/organizaciones/components/AvatarOrganizacion";
import { AvatarOrganizacionControles } from "@/modules/organizaciones/components/AvatarOrganizacionControles";
import { useMiembrosQuery } from "@/modules/organizaciones/hooks/useMiembros";
import { puedeEn } from "@/modules/organizaciones/utils/permisos";
import { useTagsQuery } from "@/modules/tags/hooks/useTagsQuery";
import { EstadisticasTareas } from "@/modules/tareas/components/EstadisticasTareas";
import { DelegadosForm } from "../components/DelegadosForm";
import { EquipoForm } from "../components/EquipoForm";
import {
	useAvatarEquipoMutation,
	useEquiposQuery,
	useGestionEquipos,
} from "../hooks/useEquipos";

/** Un equipo: sus miembros y sus acciones (RN-20 a 26). */
export function EquipoPage({
	organizacion,
	equipoId,
}: {
	organizacion: OrganizacionDto;
	equipoId: number;
}) {
	const organizacionId = organizacion.id;
	const navigate = useNavigate();
	const yo = useAuthStore((state) => state.usuario?.id);
	const { data: equipos } = useEquiposQuery(organizacionId);
	const { data: miembros = [] } = useMiembrosQuery(organizacionId);
	// shortcut: los 100 primeros tags; paginar si una organización tiene más.
	const { data: paginaTags } = useTagsQuery(
		{ pagina: 1, limite: 100 },
		organizacionId,
	);
	const { eliminar } = useGestionEquipos(organizacionId);
	const avatar = useAvatarEquipoMutation(organizacionId, equipoId);
	const [dialogo, setDialogo] = useState<
		"editar" | "delegados" | "eliminar" | null
	>(null);
	const cerrar = () => setDialogo(null);

	if (!equipos) {
		return (
			<div className="flex justify-center py-16 text-tinta-tenue">
				<Spinner />
			</div>
		);
	}

	const volver = (
		<Link
			to="/organizaciones/$id/equipos"
			params={{ id: String(organizacionId) }}
			className="inline-flex items-center gap-1.5 text-sm text-tinta-tenue hover:text-tinta"
		>
			<ArrowLeft className="h-4 w-4" />
			Equipos
		</Link>
	);

	const equipo = equipos.find((e) => e.id === equipoId);
	if (!equipo) {
		return (
			<div className="space-y-4">
				{volver}
				<EmptyState icono={Users} titulo="Este equipo ya no existe" />
			</div>
		);
	}

	const tags = paginaTags?.datos ?? [];
	const nombreTag = new Map(tags.map((t) => [t.id, t.nombre]));
	const miembroOrganizacion = new Map(miembros.map((m) => [m.usuarioId, m]));
	const nombreMiembro = new Map(miembros.map((m) => [m.usuarioId, m.nombre]));
	const puedeEditar = puedeEn(organizacion, "equipos:editar");

	return (
		<div className="space-y-4">
			{volver}

			<header className="flex flex-wrap items-center gap-x-4 gap-y-3">
				<AvatarOrganizacion organizacion={equipo} className="size-10 text-sm" />
				<div className="min-w-0 flex-1 basis-48">
					<h2 className="truncate text-lg font-semibold text-tinta">
						{equipo.nombre}
					</h2>
					{equipo.tagIds.length > 0 && (
						<div className="mt-1 flex flex-wrap gap-1">
							{equipo.tagIds.map((id) => (
								<Badge key={id}>{nombreTag.get(id) ?? "…"}</Badge>
							))}
						</div>
					)}
				</div>
				<div className="flex flex-wrap items-center gap-1">
					<Button
						variant="ghost"
						size="sm"
						onClick={() =>
							navigate({
								to: "/tareas",
								search: { organizacionId, equipoId: equipo.id },
							})
						}
					>
						<ListTodo className="h-4 w-4" />
						Tareas
					</Button>
					{equipo.liderId !== null &&
						(equipo.liderId === yo || puedeEditar) && (
							<Button
								variant="ghost"
								size="sm"
								onClick={() => setDialogo("delegados")}
							>
								<UserCog className="h-4 w-4" />
								Delegados
							</Button>
						)}
					{puedeEditar && (
						<Button
							variant="ghost"
							size="sm"
							onClick={() => setDialogo("editar")}
						>
							<Pencil className="h-4 w-4" />
							Editar
						</Button>
					)}
					{puedeEn(organizacion, "equipos:eliminar") && (
						<Button
							variant="dangerGhost"
							size="sm"
							onClick={() => setDialogo("eliminar")}
						>
							<Trash2 className="h-4 w-4" />
							Eliminar
						</Button>
					)}
				</div>
			</header>

			<EstadisticasTareas
				destino={{ equipoId: equipo.id }}
				titulo="Tareas del equipo"
				nombres={nombreMiembro}
			/>

			<Card>
				<CardHeader>
					<CardTitle>Miembros ({equipo.miembros.length})</CardTitle>
				</CardHeader>
				<ul className="divide-y divide-borde">
					{equipo.miembros.map(({ usuarioId, puedeCrearTareas }) => {
						const miembro = miembroOrganizacion.get(usuarioId);
						const nombre = miembro?.nombre ?? `#${usuarioId}`;
						return (
							<li
								key={usuarioId}
								className="flex items-center gap-3 py-2.5 text-sm"
							>
								<Avatar nombre={nombre} url={miembro?.avatarUrl} />
								<div className="min-w-0 flex-1">
									<p className="truncate font-medium text-tinta">{nombre}</p>
									{miembro && (
										<p className="truncate text-xs text-tinta-tenue">
											{miembro.email}
										</p>
									)}
								</div>
								{usuarioId === equipo.liderId ? (
									<Badge variant="purple">Líder</Badge>
								) : (
									puedeCrearTareas && <Badge>Delegado</Badge>
								)}
							</li>
						);
					})}
				</ul>
			</Card>

			<Dialog
				abierto={dialogo === "editar"}
				onCerrar={cerrar}
				titulo="Editar equipo"
			>
				<div className="mb-6">
					<AvatarOrganizacionControles organizacion={equipo} avatar={avatar} />
				</div>
				<EquipoForm
					key={equipo.id}
					organizacionId={organizacionId}
					inicial={equipo}
					miembros={miembros}
					tags={tags}
					onGuardado={cerrar}
				/>
			</Dialog>

			<Dialog
				abierto={dialogo === "delegados"}
				onCerrar={cerrar}
				titulo={`Delegados de «${equipo.nombre}»`}
			>
				<DelegadosForm
					key={equipo.id}
					organizacionId={organizacionId}
					equipo={equipo}
					nombre={nombreMiembro}
					onGuardado={cerrar}
				/>
			</Dialog>

			<ConfirmDialog
				abierto={dialogo === "eliminar"}
				titulo={`¿Eliminar el equipo «${equipo.nombre}»?`}
				mensaje="Sus tareas pasan a la organización, con sus responsables. Sus miembros siguen en la organización."
				textoConfirmar="Eliminar"
				peligroso
				isLoading={eliminar.isPending}
				onCancelar={cerrar}
				onConfirmar={() =>
					eliminar.mutate(equipo.id, {
						onSuccess: () =>
							navigate({
								to: "/organizaciones/$id/equipos",
								params: { id: String(organizacionId) },
							}),
					})
				}
			/>
		</div>
	);
}
