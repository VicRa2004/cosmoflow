import { BotonInsertarImagen } from "@/modules/adjuntos/components/BotonInsertarImagen";
import { useAppForm } from "@/core/components/form/useAppForm";
import type { TareaDto } from "../api/tareasApi";
import {
	useActualizarTareaMutation,
	useCrearTareaMutation,
} from "../hooks/useTareasMutation";
import {
	ETIQUETAS_ESTADO,
	ETIQUETAS_PRIORIDAD,
	tareaAFormValues,
	tareaFormSchema,
	tareaFormVacio,
} from "../schemas/tareaSchemas";
import { SelectorTags } from "@/modules/tags/components/SelectorTags";

interface TareaFormProps {
	/** Sin `inicial` crea; con él, edita. */
	inicial?: TareaDto;
	onGuardado: () => void;
}

export function TareaForm({ inicial, onGuardado }: TareaFormProps) {
	const crear = useCrearTareaMutation();
	const actualizar = useActualizarTareaMutation();

	const form = useAppForm({
		defaultValues: inicial ? tareaAFormValues(inicial) : tareaFormVacio,
		validators: { onSubmit: tareaFormSchema },
		onSubmit: async ({ value }) => {
			const datos = tareaFormSchema.parse(value);
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
					{(campo) => (
						<div className="space-y-1">
							<campo.CampoAreaTexto
								label="Contenido"
								placeholder="Markdown: - [ ] subtarea, **negrita**…"
							/>
							<BotonInsertarImagen onChange={campo.handleChange} />
						</div>
					)}
				</form.AppField>
				<div className="grid gap-4 sm:grid-cols-2">
					<form.AppField name="estado">
						{(campo) => (
							<campo.CampoSelect label="Estado">
								{Object.entries(ETIQUETAS_ESTADO).map(([valor, texto]) => (
									<option key={valor} value={valor}>
										{texto}
									</option>
								))}
							</campo.CampoSelect>
						)}
					</form.AppField>
					<form.AppField name="prioridad">
						{(campo) => (
							<campo.CampoSelect label="Prioridad">
								{Object.entries(ETIQUETAS_PRIORIDAD).map(([valor, texto]) => (
									<option key={valor} value={valor}>
										{texto}
									</option>
								))}
							</campo.CampoSelect>
						)}
					</form.AppField>
					<form.AppField name="fechaInicio">
						{(campo) => <campo.CampoTexto label="Inicio" type="date" />}
					</form.AppField>
					<form.AppField name="fechaVencimiento">
						{(campo) => <campo.CampoTexto label="Vencimiento" type="date" />}
					</form.AppField>
				</div>
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
