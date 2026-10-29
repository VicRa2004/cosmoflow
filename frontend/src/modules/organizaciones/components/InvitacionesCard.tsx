import { Mail, RotateCw, X } from "lucide-react";
import { useAppForm } from "@/core/components/form/useAppForm";
import { Badge } from "@/core/components/ui/Badge";
import { Button } from "@/core/components/ui/Button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/core/components/ui/Card";
import {
	useGestionInvitaciones,
	useInvitacionesQuery,
} from "../hooks/useInvitaciones";
import { invitarFormSchema } from "../schemas/organizacionSchemas";

const fecha = new Intl.DateTimeFormat("es", { dateStyle: "medium" });

/** Solo el administrador: invitar por correo (RN-12) y gestionar las pendientes. */
export function InvitacionesCard({
	organizacionId,
}: {
	organizacionId: number;
}) {
	const { data: pendientes } = useInvitacionesQuery(organizacionId);
	const { invitar, reenviar, cancelar } =
		useGestionInvitaciones(organizacionId);

	const form = useAppForm({
		defaultValues: { email: "" },
		validators: { onSubmit: invitarFormSchema },
		onSubmit: async ({ value, formApi }) => {
			await invitar.mutateAsync(invitarFormSchema.parse(value).email);
			formApi.reset();
		},
	});

	return (
		<Card>
			<CardHeader>
				<CardTitle>Invitaciones</CardTitle>
				<CardDescription>
					Solo se entra por invitación. Si el email no tiene cuenta, podrá
					crearla desde el enlace.
				</CardDescription>
			</CardHeader>
			<CardContent className="space-y-4">
				<form.AppForm>
					<form.Formulario className="flex items-start gap-2">
						<form.AppField name="email">
							{(campo) => (
								<campo.CampoTexto
									aria-label="Email a invitar"
									type="email"
									placeholder="persona@ejemplo.com"
									autoComplete="off"
								/>
							)}
						</form.AppField>
						<form.BotonEnviar>
							<Mail className="h-4 w-4" />
							Invitar
						</form.BotonEnviar>
					</form.Formulario>
				</form.AppForm>

				{pendientes && pendientes.length > 0 && (
					<ul className="divide-y divide-borde rounded-lg border border-borde">
						{pendientes.map((invitacion) => (
							<li
								key={invitacion.id}
								className="flex items-center gap-3 px-3 py-2 text-sm"
							>
								<span className="min-w-0 flex-1 truncate text-tinta">
									{invitacion.email}
								</span>
								{invitacion.isCaducada ? (
									<Badge variant="warning">Caducada</Badge>
								) : (
									<span className="text-xs text-tinta-tenue">
										Caduca el {fecha.format(new Date(invitacion.expiraEn))}
									</span>
								)}
								<Button
									variant="ghost"
									size="sm"
									aria-label={`Reenviar a ${invitacion.email}`}
									title="Reenviar"
									disabled={reenviar.isPending}
									onClick={() => reenviar.mutate(invitacion.id)}
								>
									<RotateCw className="h-4 w-4" />
								</Button>
								<Button
									variant="dangerGhost"
									size="sm"
									aria-label={`Cancelar la invitación de ${invitacion.email}`}
									title="Cancelar"
									disabled={cancelar.isPending}
									onClick={() => cancelar.mutate(invitacion.id)}
								>
									<X className="h-4 w-4" />
								</Button>
							</li>
						))}
					</ul>
				)}
			</CardContent>
		</Card>
	);
}
