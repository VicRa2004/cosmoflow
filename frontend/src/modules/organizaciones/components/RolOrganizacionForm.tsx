import { useAppForm } from "@/core/components/form/useAppForm";
import { Checkbox } from "@/core/components/ui/Checkbox";
import { Select } from "@/core/components/ui/Select";
import type {
	PermisoOrganizacion,
	RolOrganizacionDto,
} from "../api/rolesOrganizacionApi";
import {
	useCatalogoPermisosQuery,
	useGestionRoles,
} from "../hooks/useRolesOrganizacion";
import { rolFormSchema } from "../schemas/organizacionSchemas";
import { ETIQUETA_PERMISO } from "../utils/permisos";

interface RolOrganizacionFormProps {
	organizacionId: number;
	/** Sin `inicial` crea (y ofrece plantillas); con él, edita. */
	inicial?: RolOrganizacionDto;
	onGuardado: () => void;
}

/** Nombre y permisos del catálogo; al crear se puede partir de una plantilla (RN-17). */
export function RolOrganizacionForm({
	organizacionId,
	inicial,
	onGuardado,
}: RolOrganizacionFormProps) {
	const { data: catalogo } = useCatalogoPermisosQuery(organizacionId);
	const { guardar } = useGestionRoles(organizacionId);

	const form = useAppForm({
		defaultValues: {
			nombre: inicial?.nombre ?? "",
			permisos: (inicial?.permisos ?? []) as PermisoOrganizacion[],
		},
		validators: { onSubmit: rolFormSchema },
		onSubmit: async ({ value }) => {
			await guardar.mutateAsync({ id: inicial?.id, datos: value });
			onGuardado();
		},
	});

	return (
		<form.AppForm>
			<form.Formulario className="space-y-4">
				{!inicial && catalogo && (
					<Select
						label="Partir de una plantilla (opcional)"
						defaultValue=""
						onChange={(e) => {
							const plantilla = catalogo.plantillas.find(
								(p) => p.nombre === e.target.value,
							);
							if (!plantilla) return;
							form.setFieldValue("nombre", plantilla.nombre);
							form.setFieldValue("permisos", plantilla.permisos);
						}}
					>
						<option value="">Desde cero</option>
						{catalogo.plantillas.map((plantilla) => (
							<option key={plantilla.nombre} value={plantilla.nombre}>
								{plantilla.nombre}
							</option>
						))}
					</Select>
				)}
				<form.AppField name="nombre">
					{(campo) => <campo.CampoTexto label="Nombre" maxLength={64} />}
				</form.AppField>
				<form.Field name="permisos">
					{(campo) => (
						<fieldset className="space-y-2">
							<legend className="mb-1 text-[13px] font-medium text-tinta-suave">
								Permisos
							</legend>
							<p className="text-xs text-tinta-tenue">
								Ver la organización no necesita permiso: basta con ser miembro.
							</p>
							{catalogo?.permisos.map((permiso) => (
								<Checkbox
									key={permiso}
									label={ETIQUETA_PERMISO[permiso]}
									checked={campo.state.value.includes(permiso)}
									onChange={(e) =>
										campo.handleChange(
											e.target.checked
												? [...campo.state.value, permiso]
												: campo.state.value.filter((p) => p !== permiso),
										)
									}
								/>
							))}
						</fieldset>
					)}
				</form.Field>
				<div className="flex justify-end">
					<form.BotonEnviar>
						{inicial ? "Guardar" : "Crear rol"}
					</form.BotonEnviar>
				</div>
			</form.Formulario>
		</form.AppForm>
	);
}
