import { ArrowLeft, FolderInput } from "lucide-react";
import { useState } from "react";
import { Button } from "@/core/components/ui/Button";
import { useAppForm } from "@/core/components/form/useAppForm";
import { destinoDe, type TareaDto } from "../api/tareasApi";
import { CampoResponsables } from "./CampoResponsables";
import { EditorTarea } from "./EditorTarea";
import { MoverTareaDialog } from "./MoverTareaDialog";
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
	type ContextoTareaSearch,
} from "../schemas/tareaSchemas";
import { SelectorTags } from "@/modules/tags/components/SelectorTags";

interface TareaFormProps {
	/** Sin `inicial` crea; con él, edita. */
	inicial?: TareaDto;
	/** Al crear: organización, equipo o proyecto donde va (sin él, personal). */
	contexto?: ContextoTareaSearch;
	onGuardado: () => void;
	onVolver: () => void;
}

const mismos = (a: number[], b: number[]) =>
	a.length === b.length && a.every((id) => b.includes(id));

/** Página-documento de una tarea: título grande, propiedades y el editor debajo. */
export function TareaForm({
	inicial,
	contexto,
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

	const form = useAppForm({
		defaultValues: inicial ? tareaAFormValues(inicial) : tareaFormVacio,
		validators: { onSubmit: tareaFormSchema },
		onSubmit: async ({ value }) => {
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
						<form.BotonEnviar>{inicial ? "Guardar" : "Crear"}</form.BotonEnviar>
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
