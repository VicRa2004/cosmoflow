import { z } from "zod";
import { useAppForm } from "@/core/components/form/useAppForm";
import { Dialog } from "@/core/components/ui/Dialog";
import { useOrganizacionQuery } from "@/modules/organizaciones/hooks/useOrganizacionesQuery";
import { puedeEn } from "@/modules/organizaciones/utils/permisos";
import type { TareaDto } from "@/modules/tareas/api/tareasApi";
import { useCrearPlantillaMutation } from "../hooks/usePlantillas";

const plantillaFormSchema = z.object({
	nombre: z.string().trim().min(1, "Obligatorio").max(100, "Máximo 100"),
	destino: z.enum(["personal", "organizacion"]),
});

/** Guarda título, contenido, prioridad, color y checklist (no fechas, tags ni responsables). */
function FormularioPlantilla({
	tarea,
	organizacion,
	onGuardado,
}: {
	tarea: TareaDto;
	/** Solo si la tarea es de una organización donde puede gestionar plantillas. */
	organizacion?: { id: number; nombre: string };
	onGuardado: () => void;
}) {
	const crear = useCrearPlantillaMutation();
	const form = useAppForm({
		defaultValues: {
			nombre: tarea.titulo.slice(0, 100),
			destino: "personal" as "personal" | "organizacion",
		},
		validators: { onSubmit: plantillaFormSchema },
		onSubmit: async ({ value }) => {
			const { nombre, destino } = plantillaFormSchema.parse(value);
			await crear.mutateAsync({
				organizacionId:
					destino === "organizacion" ? organizacion?.id : undefined,
				datos: {
					nombre,
					titulo: tarea.titulo,
					contenido: tarea.contenido,
					prioridad: tarea.prioridad,
					color: tarea.color,
					subtareas: tarea.subtareas.map((s) => s.titulo),
				},
			});
			onGuardado();
		},
	});

	return (
		<form.AppForm>
			<form.Formulario className="space-y-4">
				<form.AppField name="nombre">
					{(campo) => (
						<campo.CampoTexto label="Nombre" placeholder="Ej.: Release" />
					)}
				</form.AppField>
				{organizacion && (
					<form.AppField name="destino">
						{(campo) => (
							<campo.CampoSelect label="Guardar en">
								<option value="personal">Mis plantillas</option>
								<option value="organizacion">
									{organizacion.nombre} (para todos sus miembros)
								</option>
							</campo.CampoSelect>
						)}
					</form.AppField>
				)}
				<div className="flex justify-end">
					<form.BotonEnviar>Guardar plantilla</form.BotonEnviar>
				</div>
			</form.Formulario>
		</form.AppForm>
	);
}

function FormularioEnOrganizacion({
	tarea,
	organizacionId,
	onGuardado,
}: {
	tarea: TareaDto;
	organizacionId: number;
	onGuardado: () => void;
}) {
	const { data: organizacion } = useOrganizacionQuery(organizacionId);
	const permitida =
		organizacion && puedeEn(organizacion, "plantillas:gestionar")
			? organizacion
			: undefined;
	return (
		<FormularioPlantilla
			// Al llegar los permisos aparece la opción de la organización.
			key={permitida ? "con-organizacion" : "personal"}
			tarea={tarea}
			organizacion={permitida}
			onGuardado={onGuardado}
		/>
	);
}

export function GuardarPlantillaDialog({
	tarea,
	abierto,
	onCerrar,
}: {
	tarea: TareaDto;
	abierto: boolean;
	onCerrar: () => void;
}) {
	return (
		<Dialog
			abierto={abierto}
			onCerrar={onCerrar}
			titulo="Guardar como plantilla"
			descripcion="Guarda el título, el contenido, la prioridad, el color y la checklist. Las fechas, los tags y los responsables se eligen al usarla."
		>
			{abierto &&
				(tarea.organizacionId === null ? (
					<FormularioPlantilla tarea={tarea} onGuardado={onCerrar} />
				) : (
					<FormularioEnOrganizacion
						tarea={tarea}
						organizacionId={tarea.organizacionId}
						onGuardado={onCerrar}
					/>
				))}
		</Dialog>
	);
}
