import { useAppForm } from "@/core/components/form/useAppForm";
import { Dialog } from "@/core/components/ui/Dialog";
import { cn } from "@/core/utils/cn";
import type { CarpetaDto } from "../api/notasApi";
import {
	useActualizarCarpetaMutation,
	useCrearCarpetaMutation,
} from "../hooks/useCarpetas";
import {
	carpetaAFormValues,
	carpetaFormSchema,
} from "../schemas/carpetaSchemas";
import { ICONOS_CARPETA } from "./IconoCarpeta";
import { ordenEnArbol, subarbol } from "../utils/arbolCarpetas";

interface CarpetaDialogProps {
	/** `undefined`: cerrado. Con `carpeta`, edita; sin ella, crea dentro de `padreId`. */
	estado?: { carpeta?: CarpetaDto; padreId: number | null };
	carpetas: CarpetaDto[];
	proyectoId?: number;
	onCerrar: () => void;
}

export function CarpetaDialog({
	estado,
	carpetas,
	proyectoId,
	onCerrar,
}: CarpetaDialogProps) {
	return (
		<Dialog
			abierto={estado !== undefined}
			onCerrar={onCerrar}
			titulo={estado?.carpeta ? "Editar carpeta" : "Nueva carpeta"}
		>
			{estado && (
				<FormCarpeta
					// Reinicia el formulario al cambiar de carpeta.
					key={estado.carpeta?.id ?? `nueva-${estado.padreId}`}
					{...estado}
					carpetas={carpetas}
					proyectoId={proyectoId}
					onCerrar={onCerrar}
				/>
			)}
		</Dialog>
	);
}

function FormCarpeta({
	carpeta,
	padreId,
	carpetas,
	proyectoId,
	onCerrar,
}: Omit<CarpetaDialogProps, "estado"> & {
	carpeta?: CarpetaDto;
	padreId: number | null;
}) {
	const crear = useCrearCarpetaMutation();
	const actualizar = useActualizarCarpetaMutation();
	// No se puede mover dentro de sí misma ni de una descendiente.
	const prohibidas = carpeta
		? subarbol(carpeta.id, carpetas)
		: new Set<number>();
	const form = useAppForm({
		defaultValues: carpetaAFormValues(carpeta, padreId),
		validators: { onSubmit: carpetaFormSchema },
		onSubmit: async ({ value }) => {
			const datos = carpetaFormSchema.parse(value);
			if (carpeta) await actualizar.mutateAsync({ id: carpeta.id, datos });
			else
				await crear.mutateAsync({
					...datos,
					...(proyectoId && { proyectoId }),
				});
			onCerrar();
		},
	});

	return (
		<form.AppForm>
			<form.Formulario className="space-y-4">
				<form.AppField name="nombre">
					{(campo) => (
						<campo.CampoTexto label="Nombre" placeholder="Viajes" autoFocus />
					)}
				</form.AppField>
				<form.AppField name="icono">
					{(campo) => (
						<fieldset className="space-y-1.5">
							<legend className="mb-1.5 text-[13px] font-medium text-tinta-suave">
								Icono
							</legend>
							<div className="flex flex-wrap gap-1">
								{Object.entries(ICONOS_CARPETA).map(([icono, Icono]) => (
									<button
										key={icono}
										type="button"
										aria-label={`Icono ${icono}`}
										title={icono}
										aria-pressed={campo.state.value === icono}
										onClick={() => campo.handleChange(icono)}
										className={cn(
											"flex h-8 w-8 items-center justify-center rounded-md text-tinta-suave hover:bg-elevada",
											campo.state.value === icono &&
												"bg-elevada ring-2 ring-indigo-500",
										)}
									>
										<Icono className="h-4 w-4" />
									</button>
								))}
							</div>
						</fieldset>
					)}
				</form.AppField>
				<form.AppField name="color">
					{(campo) => <campo.CampoColorAcento />}
				</form.AppField>
				<form.AppField name="padreId">
					{(campo) => (
						<campo.CampoSelect label="Dentro de">
							<option value="">Raíz</option>
							{ordenEnArbol(carpetas)
								.filter(({ carpeta: c }) => !prohibidas.has(c.id))
								.map(({ carpeta: c, nivel }) => (
									<option key={c.id} value={c.id}>
										{"  ".repeat(nivel)}
										{c.nombre}
									</option>
								))}
						</campo.CampoSelect>
					)}
				</form.AppField>
				<div className="flex justify-end">
					<form.BotonEnviar>{carpeta ? "Guardar" : "Crear"}</form.BotonEnviar>
				</div>
			</form.Formulario>
		</form.AppForm>
	);
}
