import { useAppForm } from "@/core/components/form/useAppForm";
import type { TagDto } from "../api/tagsApi";
import {
	useActualizarTagMutation,
	useCrearTagMutation,
} from "../hooks/useTagsMutation";
import {
	tagAFormValues,
	tagFormSchema,
	tagFormVacio,
} from "../schemas/tagSchemas";

interface TagFormProps {
	/** Sin `inicial` crea; con él, edita. */
	inicial?: TagDto;
	/** Sin él, tag personal. */
	organizacionId?: number;
	onGuardado: () => void;
}

export function TagForm({ inicial, organizacionId, onGuardado }: TagFormProps) {
	const crear = useCrearTagMutation(organizacionId);
	const actualizar = useActualizarTagMutation(organizacionId);

	const form = useAppForm({
		defaultValues: inicial ? tagAFormValues(inicial) : tagFormVacio,
		validators: { onSubmit: tagFormSchema },
		onSubmit: async ({ value }) => {
			const datos = tagFormSchema.parse(value);
			if (inicial) await actualizar.mutateAsync({ id: inicial.id, datos });
			else await crear.mutateAsync(datos);
			onGuardado();
		},
	});

	return (
		<form.AppForm>
			<form.Formulario className="space-y-4">
				<form.AppField name="nombre">
					{(campo) => <campo.CampoTexto label="Nombre" />}
				</form.AppField>
				<div className="flex justify-end">
					<form.BotonEnviar>{inicial ? "Guardar" : "Crear"}</form.BotonEnviar>
				</div>
			</form.Formulario>
		</form.AppForm>
	);
}
