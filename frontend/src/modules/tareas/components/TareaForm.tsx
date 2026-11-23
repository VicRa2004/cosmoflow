import { ArrowLeft, FolderInput } from "lucide-react";
import { useState } from "react";
import { Button } from "@/core/components/ui/Button";
import { Kbd } from "@/core/components/ui/Kbd";
import { useAppForm } from "@/core/components/form/useAppForm";
import { useAtajoGuardar } from "@/core/components/form/useAtajoGuardar";
import type { PlantillaTareaDto } from "@/modules/plantillas/api/plantillasApi";
import { destinoDe, type TareaDto } from "../api/tareasApi";
import { CampoResponsables } from "./CampoResponsables";
import {
	CampoDependeDe,
	CampoEstado,
	CampoPrioridad,
	CampoRecurrencia,
} from "./CamposPropiedades";
import { useTareasQuery } from "../hooks/useTareasQuery";
import { EditorTarea } from "./EditorTarea";
import { MoverTareaDialog } from "./MoverTareaDialog";
import {
	useActualizarTareaMutation,
	useCrearTareaMutation,
} from "../hooks/useTareasMutation";
import {
	plantillaAFormValues,
	tareaAFormValues,
	tareaFormSchema,
	tareaFormVacio,
	type ContextoTareaSearch,
} from "../schemas/tareaSchemas";
import { SelectorTags } from "@/modules/tags/components/SelectorTags";
import { SubtareasField } from "./SubtareasField";

interface TareaFormProps {
	/** Sin `inicial` crea; con él, edita. */
	inicial?: TareaDto;
	/** Al crear: organización, equipo o proyecto donde va (sin él, personal). */
	contexto?: ContextoTareaSearch;
	/** Al crear: rellena el formulario con ella (#175). */
	plantilla?: PlantillaTareaDto;
	onGuardado: () => void;
	onVolver: () => void;
}

const mismos = (a: number[], b: number[]) =>
	a.length === b.length && a.every((id) => b.includes(id));

/** Página-documento de una tarea: título grande, propiedades y el editor debajo. */
export function TareaForm({
	inicial,
	contexto,
	plantilla,
	onGuardado,
	onVolver,
}: TareaFormProps) {
	const crear = useCrearTareaMutation();
	const actualizar = useActualizarTareaMutation();
	const [moviendo, setMoviendo] = useState(false);
	const equipoId = inicial ? inicial.equipoId : contexto?.equipoId;
	const proyectoId = inicial ? inicial.proyectoId : contexto?.proyectoId;
	const organizacionId =
		(inicial ? inicial.organizacionId : contexto?.organizacionId) ?? null;
	const destino =
		organizacionId !== null
			? destinoDe({ organizacionId, equipoId, proyectoId })
			: undefined;

	// Candidatas a principal: las del mismo sitio (las personales sin destino).
	const { data: delSitio } = useTareasQuery({ ...destino, limite: 100 });
	const principales = (delSitio?.datos ?? []).filter(
		(t) => t.id !== inicial?.id,
	);

	const form = useAppForm({
		defaultValues: inicial
			? tareaAFormValues(inicial)
			: plantilla
				? plantillaAFormValues(plantilla)
				: tareaFormVacio(),
		validators: { onSubmit: tareaFormSchema },
		// `quedarse`: Ctrl+S al editar guarda sin salir; el botón sí sale.
		onSubmitMeta: { quedarse: false },
		onSubmit: async ({ value, meta }) => {
			const { responsableIds, ...datos } = tareaFormSchema.parse(value);
			if (inicial) {
				// Solo si cambian: sin ser líder ni delegado, enviarlos daría 403 (RN-22).
				const asignar = !mismos(responsableIds, inicial.responsableIds);
				await actualizar.mutateAsync({
					id: inicial.id,
					datos: asignar ? { ...datos, responsableIds } : datos,
				});
			} else {
				await crear.mutateAsync(
					destino ? { ...datos, ...destino, responsableIds } : datos,
				);
			}
			if (!meta.quedarse) onGuardado();
		},
	});
	useAtajoGuardar(() => {
		if (!form.state.isSubmitting)
			form.handleSubmit({ quedarse: !!inicial }).catch(() => {});
	});

	return (
		<form.AppForm>
			<form.Formulario className="mx-auto max-w-3xl space-y-6">
				<div className="flex items-center justify-between gap-2">
					<Button variant="ghost" size="sm" onClick={onVolver}>
						<ArrowLeft className="h-4 w-4" />
						Volver
					</Button>
					<div className="flex items-center gap-2">
						{inicial && inicial.organizacionId === null && (
							<Button
								variant="secondary"
								size="sm"
								onClick={() => setMoviendo(true)}
							>
								<FolderInput className="h-4 w-4" />
								Mover a una organización
							</Button>
						)}
						<form.BotonEnviar>
							{inicial ? "Guardar" : "Crear"}
							<Kbd
								tecla="S"
								className="border-white/25 bg-white/15 text-white"
							/>
						</form.BotonEnviar>
					</div>
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
							<CampoEstado
								valor={campo.state.value}
								onChange={campo.handleChange}
							/>
						)}
					</form.AppField>
					<form.AppField name="prioridad">
						{(campo) => (
							<CampoPrioridad
								valor={campo.state.value}
								onChange={campo.handleChange}
							/>
						)}
					</form.AppField>
					<form.AppField name="fechaInicio">
						{(campo) => <campo.CampoTexto label="Inicio" type="date" />}
					</form.AppField>
					<form.AppField name="fechaVencimiento">
						{(campo) => <campo.CampoTexto label="Vencimiento" type="date" />}
					</form.AppField>
				</div>
				<div className="grid gap-4 sm:grid-cols-2">
					<form.AppField name="dependeDeId">
						{(campo) => (
							<CampoDependeDe
								valor={campo.state.value}
								onChange={campo.handleChange}
								candidatas={principales}
							/>
						)}
					</form.AppField>
					<form.AppField name="recurrencia">
						{(campo) => (
							<CampoRecurrencia
								valor={campo.state.value}
								onChange={campo.handleChange}
							/>
						)}
					</form.AppField>
				</div>
				<div className="grid gap-4 sm:grid-cols-2">
					<form.AppField name="tagIds">
						{(campo) => (
							<SelectorTags
								valor={campo.state.value}
								onChange={campo.handleChange}
								organizacionId={organizacionId}
							/>
						)}
					</form.AppField>
					{organizacionId !== null && (
						<form.Field name="responsableIds">
							{(campo) => (
								<CampoResponsables
									organizacionId={organizacionId}
									equipoId={equipoId}
									proyectoId={proyectoId}
									valor={campo.state.value}
									onChange={campo.handleChange}
								/>
							)}
						</form.Field>
					)}
				</div>
				<form.Field name="subtareas">
					{(campo) => (
						<SubtareasField
							valor={campo.state.value}
							onChange={campo.handleChange}
						/>
					)}
				</form.Field>
				<form.AppField name="color">
					{(campo) => <campo.CampoColorAcento />}
				</form.AppField>
				<hr className="border-borde" />
				<form.AppField name="contenido">
					{() => (
						<EditorTarea
							organizacionId={organizacionId}
							equipoId={equipoId}
							proyectoId={proyectoId}
							label="Contenido"
							ambito={destino}
							className="-ml-12"
							placeholder={
								organizacionId === null
									? "Escribe o pulsa «/»: lista de tareas, título, imagen…"
									: "Escribe, pulsa «/» para insertar un bloque o «@» para mencionar…"
							}
						/>
					)}
				</form.AppField>
			</form.Formulario>
			{inicial && (
				<MoverTareaDialog
					tarea={inicial}
					abierto={moviendo}
					onCerrar={() => setMoviendo(false)}
					onMovida={onVolver}
				/>
			)}
		</form.AppForm>
	);
}
