import { Link, useNavigate } from "@tanstack/react-router";
import { Building2 } from "lucide-react";
import { toast } from "sonner";
import { getErrorMessage } from "@/core/api/client";
import { Button } from "@/core/components/ui/Button";
import { EmptyState } from "@/core/components/ui/EmptyState";
import { Spinner } from "@/core/components/ui/Spinner";
import {
	useInvitacionRecibidaQuery,
	useResponderInvitacionMutation,
} from "../hooks/useInvitaciones";

/** Destino del enlace del correo: aceptar o rechazar, ya con sesión iniciada. */
export function InvitacionPage({ token }: { token: string }) {
	const navigate = useNavigate();
	const { data, error } = useInvitacionRecibidaQuery(token);
	const responder = useResponderInvitacionMutation();

	const volver = (
		<Link
			to="/dashboard"
			className="text-sm font-medium text-indigo-400 hover:underline"
		>
			Ir a mis pendientes
		</Link>
	);

	if (error) {
		return (
			<EmptyState
				icono={Building2}
				titulo="No se puede abrir la invitación"
				descripcion={getErrorMessage(error)}
				accion={volver}
			/>
		);
	}
	if (!data) {
		return (
			<div className="flex justify-center py-16 text-tinta-tenue">
				<Spinner />
			</div>
		);
	}
	if (!data.isVigente) {
		return (
			<EmptyState
				icono={Building2}
				titulo="La invitación ya no es válida"
				descripcion={`Caducó o ya se respondió. Pide a «${data.nombreOrganizacion}» que te la reenvíe.`}
				accion={volver}
			/>
		);
	}

	const responderCon = (aceptar: boolean) =>
		responder.mutate(
			{ token, aceptar },
			{
				onSuccess: ({ organizacionId }) => {
					if (aceptar) {
						toast.success(`Ya eres miembro de ${data.nombreOrganizacion}`);
						navigate({
							to: "/organizaciones/$id",
							params: { id: String(organizacionId) },
						});
					} else {
						toast.success("Invitación rechazada");
						navigate({ to: "/dashboard" });
					}
				},
			},
		);

	return (
		<EmptyState
			icono={Building2}
			titulo={`Te han invitado a «${data.nombreOrganizacion}»`}
			descripcion={`La invitación es para ${data.email}. Al aceptar entrarás como miembro.`}
			accion={
				<div className="flex gap-2">
					<Button
						variant="outline"
						disabled={responder.isPending}
						onClick={() => responderCon(false)}
					>
						Rechazar
					</Button>
					<Button
						isLoading={responder.isPending}
						onClick={() => responderCon(true)}
					>
						Aceptar
					</Button>
				</div>
			}
		/>
	);
}
