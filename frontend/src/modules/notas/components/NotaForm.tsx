import { ArrowLeft } from "lucide-react";
import { Button } from "@/core/components/ui/Button";
import { Kbd } from "@/core/components/ui/Kbd";
import { EditorMarkdown } from "@/modules/adjuntos/components/EditorMarkdown";
import { SelectorTags } from "@/modules/tags/components/SelectorTags";
import { useAppForm } from "@/core/components/form/useAppForm";
import { useAtajoGuardar } from "@/core/components/form/useAtajoGuardar";
import type { NotaDto } from "../api/notasApi";
import { useCarpetasQuery } from "../hooks/useCarpetas";
import { ordenEnArbol } from "../utils/arbolCarpetas";
import {
	useActualizarNotaMutation,
	useCrearNotaMutation,
} from "../hooks/useNotasMutation";
import {
	notaAFormValues,
	notaFormSchema,
	notaFormVacio,
	type ContextoNotaSearch,
} from "../schemas/notaSchemas";

interface NotaFormProps {
	/** Sin `inicial` crea; con él, edita. */
	inicial?: NotaDto;
	/** Al crear: proyecto donde va (sin él, personal). */
	contexto?: ContextoNotaSearch;
	onGuardado: () => void;
	onVolver: () => void;
}

/** Página-documento de una nota: título grande, tags y el editor debajo. */
export function NotaForm({
	inicial,
	contexto,
	onGuardado,
	onVolver,
}: NotaFormProps) {
	const crear = useCrearNotaMutation();
	const actualizar = useActualizarNotaMutation();
	const proyectoId =
		(inicial ? inicial.proyectoId : contexto?.proyectoId) ?? null;
	const organizacionId =
		(inicial ? inicial.organizacionId : contexto?.organizacionId) ?? null;
	const { data: carpetas = [] } = useCarpetasQuery(proyectoId ?? undefined);

	const form = useAppForm({
		defaultValues: inicial
			? notaAFormValues(inicial)
			: { ...notaFormVacio, carpetaId: String(contexto?.carpetaId ?? "") },
		validators: { onSubmit: notaFormSchema },
		// `quedarse`: Ctrl+S al editar guarda sin salir; el botón sí sale.
		onSubmitMeta: { quedarse: false },
		onSubmit: async ({ value, meta }) => {
			const datos = notaFormSchema.parse(value);
			if (inicial) await actualizar.mutateAsync({ id: inicial.id, datos });
			else
				await crear.mutateAsync(proyectoId ? { ...datos, proyectoId } : datos);
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
					<form.BotonEnviar>
						{inicial ? "Guardar" : "Crear"}
						<Kbd tecla="S" className="border-white/25 bg-white/15 text-white" />
					</form.BotonEnviar>
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
				<form.AppField name="color">
					{(campo) => <campo.CampoColorAcento />}
				</form.AppField>
				{carpetas.length > 0 && (
					<form.AppField name="carpetaId">
						{(campo) => (
							<campo.CampoSelect label="Carpeta" className="sm:w-72">
								<option value="">Sin carpeta</option>
								{ordenEnArbol(carpetas).map(({ carpeta, nivel }) => (
									<option key={carpeta.id} value={carpeta.id}>
										{"\u00a0\u00a0".repeat(nivel)}
										{carpeta.icono ?? "📁"} {carpeta.nombre}
									</option>
								))}
							</campo.CampoSelect>
						)}
					</form.AppField>
				)}
				<form.AppField name="tagIds">
					{(campo) => (
						<SelectorTags
							valor={campo.state.value}
							onChange={campo.handleChange}
							organizacionId={proyectoId ? organizacionId : null}
						/>
					)}
				</form.AppField>
				<hr className="border-borde" />
				<form.AppField name="contenido">
					{() => (
						<EditorMarkdown
							label="Contenido"
							className="-ml-12"
							ambito={proyectoId ? { proyectoId } : undefined}
						/>
					)}
				</form.AppField>
			</form.Formulario>
		</form.AppForm>
	);
}
