import { useNavigate } from "@tanstack/react-router";
import { Trash2 } from "lucide-react";
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
import { ConfirmDialog } from "@/core/components/ui/ConfirmDialog";
import { Spinner } from "@/core/components/ui/Spinner";
import { AvatarOrganizacion } from "../components/AvatarOrganizacion";
import { AvatarOrganizacionControles } from "../components/AvatarOrganizacionControles";
import { InvitacionesCard } from "../components/InvitacionesCard";
import { MiembrosCard } from "../components/MiembrosCard";
import { RolesCard } from "../components/RolesCard";
import { puedeEn } from "../utils/permisos";
import { OrganizacionForm } from "../components/OrganizacionForm";
import { useEliminarOrganizacionMutation } from "../hooks/useOrganizacionesMutation";
import { useOrganizacionQuery } from "../hooks/useOrganizacionesQuery";

/** Portada de una organización; el administrador la personaliza o la elimina aquí. */
export function OrganizacionPage({ id }: { id: number }) {
	const navigate = useNavigate();
	const { data, error } = useOrganizacionQuery(id);
	const eliminar = useEliminarOrganizacionMutation();
	const [confirmando, setConfirmando] = useState(false);

	if (error) throw error;
	if (!data) {
		return (
			<div className="flex justify-center py-16 text-tinta-tenue">
				<Spinner />
			</div>
		);
	}

	return (
		<div className="mx-auto max-w-3xl space-y-6">
			<header className="flex items-center gap-4">
				<AvatarOrganizacion organizacion={data} className="size-12 text-base" />
				<div className="min-w-0 flex-1">
					<h1 className="truncate text-xl font-semibold tracking-tight text-tinta">
						{data.nombre}
					</h1>
					{data.descripcion && (
						<p className="text-sm text-tinta-tenue">{data.descripcion}</p>
					)}
				</div>
				<Badge variant={data.isAdmin ? "purple" : "default"}>
					{data.isAdmin ? "Administrador" : "Miembro"}
				</Badge>
			</header>

			<MiembrosCard organizacion={data} />

			{puedeEn(data, "organizacion:editar") && (
				<Card>
					<CardHeader>
						<CardTitle>Personalización</CardTitle>
						<CardDescription>
							Imagen, o iniciales sobre el color elegido si no hay imagen.
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-6">
						<AvatarOrganizacionControles organizacion={data} />
						<OrganizacionForm
							key={data.id}
							inicial={data}
							onGuardado={() => {}}
						/>
					</CardContent>
				</Card>
			)}

			{puedeEn(data, "miembros:invitar") && (
				<InvitacionesCard organizacionId={data.id} />
			)}

			{puedeEn(data, "roles:gestionar") && (
				<RolesCard organizacionId={data.id} />
			)}

			{data.isAdmin && (
				<Card>
					<CardHeader>
						<CardTitle>Eliminar organización</CardTitle>
						<CardDescription>
							Deja de estar disponible para todos sus miembros.
						</CardDescription>
					</CardHeader>
					<CardContent>
						<Button variant="danger" onClick={() => setConfirmando(true)}>
							<Trash2 className="h-4 w-4" />
							Eliminar
						</Button>
					</CardContent>
				</Card>
			)}

			<ConfirmDialog
				abierto={confirmando}
				titulo={`¿Eliminar «${data.nombre}»?`}
				mensaje="Ningún miembro podrá volver a verla. Solo se recupera desde la base de datos."
				textoConfirmar="Eliminar"
				peligroso
				isLoading={eliminar.isPending}
				onCancelar={() => setConfirmando(false)}
				onConfirmar={() =>
					eliminar.mutate(data.id, {
						onSuccess: () => navigate({ to: "/organizaciones" }),
					})
				}
			/>
		</div>
	);
}
