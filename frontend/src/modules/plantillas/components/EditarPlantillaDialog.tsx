import { useAppForm } from "@/core/components/form/useAppForm";
import { Dialog } from "@/core/components/ui/Dialog";
import { EditorMarkdown } from "@/modules/adjuntos/components/EditorMarkdown";
import { CampoPrioridad } from "@/modules/tareas/components/CamposPropiedades";
import { SubtareasField } from "@/modules/tareas/components/SubtareasField";
import type { PlantillaTareaDto } from "../api/plantillasApi";
import { useActualizarPlantillaMutation } from "../hooks/usePlantillas";
import {
	editarPlantillaFormSchema,
	plantillaAEdicion,
} from "../schemas/plantillaSchemas";

function FormularioEdicion({
	plantilla,
	organizacionId,
	onGuardado,
}: {
	plantilla: PlantillaTareaDto;
	organizacionId?: number;
	onGuardado: () => void;
}) {
	const actualizar = useActualizarPlantillaMutation(organizacionId);
	const form = useAppForm({
		defaultValues: plantillaAEdicion(plantilla),
		validators: { onSubmit: editarPlantillaFormSchema },
		onSubmit: async ({ value }) => {
			await actualizar.mutateAsync({
				id: plantilla.id,
				datos: editarPlantillaFormSchema.parse(value),
			});
			onGuardado();
		},
	});

	return (
		<form.AppForm>
			<form.Formulario className="space-y-4">
				<form.AppField name="nombre">
					{(campo) => <campo.CampoTexto label="Nombre" />}
				</form.AppField>
				<form.AppField name="titulo">
					{(campo) => <campo.CampoTexto label="Título de la tarea" />}
				</form.AppField>
				<div className="grid gap-4 sm:grid-cols-2">
					<form.AppField name="prioridad">
						{(campo) => (
							<CampoPrioridad
								valor={campo.state.value}
								onChange={campo.handleChange}
							/>
						)}
					</form.AppField>
					<form.AppField name="color">
						{(campo) => <campo.CampoColorAcento />}
					</form.AppField>
				</div>
				<form.Field name="subtareas">
					{(campo) => (
						<SubtareasField
							valor={campo.state.value}
							onChange={campo.handleChange}
						/>
					)}
				</form.Field>
				<form.AppField name="contenido">
					{() => (
						<EditorMarkdown
							label="Contenido"
							ambito={organizacionId ? { organizacionId } : undefined}
						/>
					)}
				</form.AppField>
				<div className="flex justify-end">
					<form.BotonEnviar>Guardar cambios</form.BotonEnviar>
				</div>
			</form.Formulario>
		</form.AppForm>
	);
}

/** Edita nombre, título, contenido, prioridad, color y checklist de una plantilla (#176). */
export function EditarPlantillaDialog({
	plantilla,
	organizacionId,
	onCerrar,
}: {
	/** `null`: cerrado. */
	plantilla: PlantillaTareaDto | null;
	organizacionId?: number;
	onCerrar: () => void;
}) {
	return (
		<Dialog
			abierto={plantilla !== null}
			onCerrar={onCerrar}
			titulo="Editar plantilla"
			descripcion="Las tareas ya creadas con ella no cambian."
			className="max-w-2xl"
		>
			{plantilla && (
				<FormularioEdicion
					key={plantilla.id}
					plantilla={plantilla}
					organizacionId={organizacionId}
					onGuardado={onCerrar}
				/>
			)}
		</Dialog>
	);
}
