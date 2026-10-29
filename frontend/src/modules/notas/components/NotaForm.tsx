import { EditorMarkdown } from "@/modules/adjuntos/components/EditorMarkdown";
import { SelectorTags } from "@/modules/tags/components/SelectorTags";
import { useAppForm } from "@/core/components/form/useAppForm";
import type { NotaDto } from "../api/notasApi";
import {
	useActualizarNotaMutation,
	useCrearNotaMutation,
} from "../hooks/useNotasMutation";
import {
	notaAFormValues,
	notaFormSchema,
	notaFormVacio,
} from "../schemas/notaSchemas";

interface NotaFormProps {
	/** Sin `inicial` crea; con él, edita. */
	inicial?: NotaDto;
	onGuardado: () => void;
}

export function NotaForm({ inicial, onGuardado }: NotaFormProps) {
	const crear = useCrearNotaMutation();
	const actualizar = useActualizarNotaMutation();

	const form = useAppForm({
		defaultValues: inicial ? notaAFormValues(inicial) : notaFormVacio,
		validators: { onSubmit: notaFormSchema },
		onSubmit: async ({ value }) => {
			const datos = notaFormSchema.parse(value);
			if (inicial) await actualizar.mutateAsync({ id: inicial.id, datos });
			else await crear.mutateAsync(datos);
			onGuardado();
		},
	});

	return (
		<form.AppForm>
			<form.Formulario className="space-y-4">
				<form.AppField name="titulo">
					{(campo) => <campo.CampoTexto label="Título" />}
				</form.AppField>
				<form.AppField name="contenido">
					{() => (
						<EditorMarkdown
							label="Contenido"
							placeholder="Markdown: ## título, - lista, **negrita**…"
							className="min-h-60"
						/>
					)}
				</form.AppField>
				<form.AppField name="tagIds">
					{(campo) => (
						<SelectorTags
							valor={campo.state.value}
							onChange={campo.handleChange}
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
