import { useNavigate } from "@tanstack/react-router";
import { Trash2 } from "lucide-react";
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
import { PreferenciasNotificacionCard } from "@/modules/notificaciones/components/PreferenciasNotificacionCard";
import type { OrganizacionDto } from "../api/organizacionesApi";
import { AvatarOrganizacionControles } from "../components/AvatarOrganizacionControles";
import { OrganizacionForm } from "../components/OrganizacionForm";
import { SinAccesoSeccion } from "../components/SinAccesoSeccion";
import {
	useAvatarOrganizacionMutation,
	useEliminarOrganizacionMutation,
} from "../hooks/useOrganizacionesMutation";
import { puedeEn } from "../utils/permisos";

/** Personalización y notificaciones (`organizacion:editar`); eliminarla, solo el administrador. */
export function AjustesOrganizacionPage({
	organizacion,
}: {
	organizacion: OrganizacionDto;
}) {
	const navigate = useNavigate();
	const eliminar = useEliminarOrganizacionMutation();
	const avatar = useAvatarOrganizacionMutation(organizacion.id);
	const [confirmando, setConfirmando] = useState(false);
	const puedeEditar = puedeEn(organizacion, "organizacion:editar");

	if (!puedeEditar && !organizacion.isAdmin) return <SinAccesoSeccion />;

	return (
		<div className="space-y-6">
			{puedeEditar && (
				<>
					<Card>
						<CardHeader>
							<CardTitle>Personalización</CardTitle>
							<CardDescription>
								Imagen, o iniciales sobre el color elegido si no hay imagen.
							</CardDescription>
						</CardHeader>
						<CardContent className="space-y-6">
							<AvatarOrganizacionControles
								organizacion={organizacion}
								avatar={avatar}
							/>
							<OrganizacionForm
								key={organizacion.id}
								inicial={organizacion}
								onGuardado={() => {}}
							/>
						</CardContent>
					</Card>
					<PreferenciasNotificacionCard organizacionId={organizacion.id} />
				</>
			)}

			{organizacion.isAdmin && (
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
				titulo={`¿Eliminar «${organizacion.nombre}»?`}
				mensaje="Ningún miembro podrá volver a verla. Solo se recupera desde la base de datos."
				textoConfirmar="Eliminar"
				peligroso
				isLoading={eliminar.isPending}
				onCancelar={() => setConfirmando(false)}
				onConfirmar={() =>
					eliminar.mutate(organizacion.id, {
						onSuccess: () => navigate({ to: "/organizaciones" }),
					})
				}
			/>
		</div>
	);
}
