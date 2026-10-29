import { useAppForm } from "@/core/components/form/useAppForm";
import { Select } from "@/core/components/ui/Select";
import type { MiembroDto } from "@/modules/organizaciones/api/miembrosApi";
import type { TagDto } from "@/modules/tags/api/tagsApi";
import type { EquipoDto } from "../api/equiposApi";
import { useGestionEquipos } from "../hooks/useEquipos";
import { equipoAFormValues, equipoFormSchema } from "../schemas/equipoSchemas";
import { CasillasIds, primerError } from "./CasillasIds";

interface EquipoFormProps {
	organizacionId: number;
	/** Sin `inicial` crea; con él, edita. */
	inicial?: EquipoDto;
	miembros: MiembroDto[];
	tags: TagDto[];
	onGuardado: () => void;
}

/** Datos, miembros (mínimo 2), líder opcional y tags de la organización. */
export function EquipoForm({
	organizacionId,
	inicial,
	miembros,
	tags,
	onGuardado,
}: EquipoFormProps) {
	const { guardar } = useGestionEquipos(organizacionId);

	const form = useAppForm({
		defaultValues: equipoAFormValues(inicial),
		validators: { onSubmit: equipoFormSchema },
		onSubmit: async ({ value }) => {
			const datos = equipoFormSchema.parse(value);
			await guardar.mutateAsync({ id: inicial?.id, datos });
			onGuardado();
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
				<form.Field name="miembroIds">
					{(campo) => (
						<CasillasIds
							leyenda="Miembros (al menos 2)"
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
				<form.Subscribe selector={(s) => s.values.miembroIds}>
					{(miembroIds) => (
						<form.Field name="liderId">
							{(campo) => (
								<Select
									label="Líder (opcional)"
									value={campo.state.value ?? ""}
									onChange={(e) =>
										campo.handleChange(
											e.target.value ? Number(e.target.value) : null,
										)
									}
									error={primerError(campo.state.meta.errors)}
								>
									<option value="">Sin líder: cualquiera crea tareas</option>
									{miembros
										.filter((m) => miembroIds.includes(m.usuarioId))
										.map((m) => (
											<option key={m.usuarioId} value={m.usuarioId}>
												{m.nombre}
											</option>
										))}
								</Select>
							)}
						</form.Field>
					)}
				</form.Subscribe>
				<form.Field name="tagIds">
					{(campo) => (
						<CasillasIds
							leyenda="Tags"
							opciones={tags.map((t) => ({ id: t.id, etiqueta: t.nombre }))}
							valor={campo.state.value}
							onChange={campo.handleChange}
							vacio="La organización aún no tiene tags."
						/>
					)}
				</form.Field>
				<div className="flex justify-end">
					<form.BotonEnviar>
						{inicial ? "Guardar" : "Crear equipo"}
					</form.BotonEnviar>
				</div>
			</form.Formulario>
		</form.AppForm>
	);
}
