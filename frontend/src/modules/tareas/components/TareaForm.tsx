import { ArrowLeft } from "lucide-react";
import { Button } from "@/core/components/ui/Button";
import { EditorMarkdown } from "@/modules/adjuntos/components/EditorMarkdown";
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
	onVolver: () => void;
}

/** Página-documento de una tarea: título grande, propiedades y el editor debajo. */
export function TareaForm({ inicial, onGuardado, onVolver }: TareaFormProps) {
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
			<form.Formulario className="mx-auto max-w-3xl space-y-6">
				<div className="flex items-center justify-between gap-2">
					<Button variant="ghost" size="sm" onClick={onVolver}>
						<ArrowLeft className="h-4 w-4" />
						Volver
					</Button>
					<form.BotonEnviar>{inicial ? "Guardar" : "Crear"}</form.BotonEnviar>
				</div>
				<form.AppField name="titulo">
					{(campo) => (
						<campo.CampoTexto
							aria-label="Título"
							placeholder="Sin título"
							autoFocus={!inicial}
							className="h-auto border-transparent bg-transparent px-0 py-1 text-3xl font-bold tracking-tight hover:border-transparent focus:border-transparent focus:ring-0"
						/>
					)}
				</form.AppField>
				<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
				<hr className="border-borde" />
				<form.AppField name="contenido">
					{() => (
						<EditorMarkdown
							label="Contenido"
							className="-ml-12"
							placeholder="Escribe o pulsa «/»: lista de tareas, título, imagen…"
						/>
					)}
				</form.AppField>
			</form.Formulario>
		</form.AppForm>
	);
}
