import { useAppForm } from "@/core/components/form/useAppForm";
import type { EquipoDto } from "@/modules/equipos/api/equiposApi";
import {
	CasillasIds,
	primerError,
} from "@/modules/equipos/components/CasillasIds";
import type { MiembroDto } from "@/modules/organizaciones/api/miembrosApi";
import type { ProyectoDto } from "../api/proyectosApi";
import { useGestionProyectos } from "../hooks/useProyectos";
import {
	ETIQUETA_ESTADO,
	proyectoAFormValues,
	proyectoFormSchema,
} from "../schemas/proyectoSchemas";

interface ProyectoFormProps {
	organizacionId: number;
	/** Sin `inicial` crea; con él, edita. */
	inicial?: ProyectoDto;
	equipos: EquipoDto[];
	miembros: MiembroDto[];
	onGuardado: () => void;
}

/** Datos, estado y sus integrantes: equipos, personas sueltas o ambos (RN-31, 32). */
export function ProyectoForm({
	organizacionId,
	inicial,
	equipos,
	miembros,
	onGuardado,
}: ProyectoFormProps) {
	const { guardar } = useGestionProyectos(organizacionId);

	const form = useAppForm({
		defaultValues: proyectoAFormValues(inicial),
		validators: { onSubmit: proyectoFormSchema },
		onSubmit: async ({ value }) => {
			const datos = proyectoFormSchema.parse(value);
			await guardar.mutateAsync({ id: inicial?.id, datos });
			onGuardado();
		},
	});

	return (
		<form.AppForm>
			<form.Formulario className="space-y-4">
				<form.AppField name="nombre">
					{(campo) => (
						<campo.CampoTexto
							label="Nombre"
							placeholder="Ej.: Lanzamiento de la web"
							maxLength={100}
						/>
					)}
				</form.AppField>
				<form.AppField name="descripcion">
					{(campo) => (
						<campo.CampoTexto
							label="Descripción (opcional)"
							placeholder="¿De qué trata el proyecto?"
							maxLength={500}
						/>
					)}
				</form.AppField>
				<form.AppField name="estado">
					{(campo) => (
						<campo.CampoSelect label="Estado">
							{Object.entries(ETIQUETA_ESTADO).map(([valor, etiqueta]) => (
								<option key={valor} value={valor}>
									{etiqueta}
								</option>
							))}
						</campo.CampoSelect>
					)}
				</form.AppField>
				<form.AppField name="color">
					{(campo) => <campo.CampoColorAcento />}
				</form.AppField>
				<form.Field name="equipoIds">
					{(campo) => (
						<CasillasIds
							leyenda="Equipos"
							opciones={equipos.map((e) => ({ id: e.id, etiqueta: e.nombre }))}
							valor={campo.state.value}
							onChange={campo.handleChange}
							vacio="La organización aún no tiene equipos."
							error={primerError(campo.state.meta.errors)}
						/>
					)}
				</form.Field>
				<form.Field name="integranteIds">
					{(campo) => (
						<CasillasIds
							leyenda="Personas sueltas"
							opciones={miembros.map((m) => ({
								id: m.usuarioId,
								etiqueta: m.nombre,
							}))}
							valor={campo.state.value}
							onChange={campo.handleChange}
							error={primerError(campo.state.meta.errors)}
						/>
					)}
				</form.Field>
				<div className="flex justify-end">
					<form.BotonEnviar>
						{inicial ? "Guardar" : "Crear proyecto"}
					</form.BotonEnviar>
				</div>
			</form.Formulario>
		</form.AppForm>
	);
}
