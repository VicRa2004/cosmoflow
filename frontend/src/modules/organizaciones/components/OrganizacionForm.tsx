import { useAppForm } from "@/core/components/form/useAppForm";
import type { OrganizacionDto } from "../api/organizacionesApi";
import {
	useActualizarOrganizacionMutation,
	useCrearOrganizacionMutation,
} from "../hooks/useOrganizacionesMutation";
import {
	organizacionAFormValues,
	organizacionFormSchema,
	organizacionFormVacio,
} from "../schemas/organizacionSchemas";

interface OrganizacionFormProps {
	/** Sin `inicial` crea; con él, edita. */
	inicial?: OrganizacionDto;
	onGuardado: (organizacion: OrganizacionDto) => void;
}

export function OrganizacionForm({
	inicial,
	onGuardado,
}: OrganizacionFormProps) {
	const crear = useCrearOrganizacionMutation();
	const actualizar = useActualizarOrganizacionMutation();

	const form = useAppForm({
		defaultValues: inicial
			? organizacionAFormValues(inicial)
			: organizacionFormVacio,
		validators: { onSubmit: organizacionFormSchema },
		onSubmit: async ({ value }) => {
			const datos = organizacionFormSchema.parse(value);
			onGuardado(
				inicial
					? await actualizar.mutateAsync({ id: inicial.id, datos })
					: await crear.mutateAsync(datos),
			);
		},
	});

	return (
		<form.AppForm>
			<form.Formulario className="space-y-4">
				<form.AppField name="nombre">
					{(campo) => <campo.CampoTexto label="Nombre" maxLength={100} />}
				</form.AppField>
				<form.AppField name="descripcion">
					{(campo) => (
						<campo.CampoTexto label="Descripción (opcional)" maxLength={500} />
					)}
				</form.AppField>
				<form.AppField name="color">
					{(campo) => (
						<campo.CampoTexto
							label="Color"
							type="color"
							className="w-16 cursor-pointer p-1"
						/>
					)}
				</form.AppField>
				<div className="flex justify-end">
					<form.BotonEnviar>{inicial ? "Guardar" : "Crear"}</form.BotonEnviar>
				</div>
			</form.Formulario>
		</form.AppForm>
	);
}
