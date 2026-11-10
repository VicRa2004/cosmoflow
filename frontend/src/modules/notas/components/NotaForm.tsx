import { useStore } from "@tanstack/react-form";
import { useBlocker } from "@tanstack/react-router";
import { ArrowLeft, ChevronRight } from "lucide-react";
import { useRef } from "react";
import { useAppForm } from "@/core/components/form/useAppForm";
import { useAtajoGuardar } from "@/core/components/form/useAtajoGuardar";
import { Button } from "@/core/components/ui/Button";
import { ConfirmDialog } from "@/core/components/ui/ConfirmDialog";
import { Kbd } from "@/core/components/ui/Kbd";
import { EditorMarkdown } from "@/modules/adjuntos/components/EditorMarkdown";
import { SelectorTags } from "@/modules/tags/components/SelectorTags";
import type { NotaDto } from "../api/notasApi";
import { useCarpetasQuery } from "../hooks/useCarpetas";
import {
	useActualizarNotaMutation,
	useCrearNotaMutation,
} from "../hooks/useNotasMutation";
import {
	type ContextoNotaSearch,
	notaAFormValues,
	notaFormSchema,
	notaFormVacio,
} from "../schemas/notaSchemas";
import { ordenEnArbol, rutaDe } from "../utils/arbolCarpetas";

interface NotaFormProps {
	/** Sin `inicial` crea; con él, edita. Solo se guarda al pulsar el botón o Ctrl+S. */
	inicial?: NotaDto;
	/** Al crear: proyecto donde va (sin él, personal). */
	contexto?: ContextoNotaSearch;
	onGuardada: (nota: NotaDto) => void;
	onVolver: () => void;
}

/** Documento de una nota como en Obsidian: título, propiedades plegadas y el editor. */
export function NotaForm({
	inicial,
	contexto,
	onGuardada,
	onVolver,
}: NotaFormProps) {
	const crear = useCrearNotaMutation();
	const actualizar = useActualizarNotaMutation();
	const proyectoId =
		(inicial ? inicial.proyectoId : contexto?.proyectoId) ?? null;
	const organizacionId =
		(inicial ? inicial.organizacionId : contexto?.organizacionId) ?? null;
	const { data: carpetas = [] } = useCarpetasQuery(proyectoId ?? undefined);

	const iniciales = inicial
		? notaAFormValues(inicial)
		: { ...notaFormVacio, carpetaId: String(contexto?.carpetaId ?? "") };
	const guardada = useRef(false);
	const form = useAppForm({
		defaultValues: iniciales,
		validators: { onSubmit: notaFormSchema },
		onSubmit: async ({ value }) => {
			const datos = notaFormSchema.parse(value);
			const nota = inicial
				? await actualizar.mutateAsync({ id: inicial.id, datos })
				: await crear.mutateAsync(
						proyectoId ? { ...datos, proyectoId } : datos,
					);
			guardada.current = true;
			onGuardada(nota);
		},
	});

	const valores = useStore(form.store, (estado) => estado.values);
	// Sin autoguardado: salir con cambios pide confirmación (también al cerrar la pestaña).
	const sinGuardar = () =>
		!guardada.current &&
		JSON.stringify(form.state.values) !== JSON.stringify(iniciales);
	const salida = useBlocker({
		shouldBlockFn: sinGuardar,
		enableBeforeUnload: sinGuardar,
		withResolver: true,
	});
	useAtajoGuardar(() => {
		if (!form.state.isSubmitting) form.handleSubmit().catch(() => {});
	});

	const ruta = inicial ? rutaDe(inicial.carpetaId, carpetas) : [];
	const palabras = valores.contenido.split(/\s+/).filter(Boolean).length;

	return (
		<form.AppForm>
			<form.Formulario className="mx-auto max-w-3xl space-y-4">
				<div className="flex min-h-9 items-center justify-between gap-2">
					<div className="flex min-w-0 items-center gap-2">
						<Button variant="ghost" size="sm" onClick={onVolver}>
							<ArrowLeft className="h-4 w-4" />
							{inicial ? "Cancelar" : "Volver"}
						</Button>
						{ruta.length > 0 && (
							<p className="truncate text-sm text-tinta-tenue">
								{ruta.join(" › ")}
							</p>
						)}
					</div>
					<div className="flex shrink-0 items-center gap-3">
						<output className="hidden text-xs text-tinta-tenue sm:block">
							{palabras} palabras
						</output>
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
				<details className="group">
					<summary className="flex w-fit cursor-pointer list-none items-center gap-1 text-sm text-tinta-tenue hover:text-tinta [&::-webkit-details-marker]:hidden">
						<ChevronRight className="h-3.5 w-3.5 transition-transform group-open:rotate-90" />
						Propiedades
						{valores.tagIds.length > 0 && ` (${valores.tagIds.length} tags)`}
					</summary>
					<div className="mt-3 space-y-4 border-l border-borde pl-4">
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
												{"  ".repeat(nivel)}
												{carpeta.nombre}
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
					</div>
				</details>
				<form.AppField name="contenido">
					{() => (
						<EditorMarkdown
							label="Contenido"
							className="-ml-12"
							ambito={proyectoId ? { proyectoId } : undefined}
							wikilinks={
								proyectoId && organizacionId
									? { proyectoId, organizacionId }
									: undefined
							}
						/>
					)}
				</form.AppField>
			</form.Formulario>
			<ConfirmDialog
				abierto={salida.status === "blocked"}
				titulo="¿Salir sin guardar?"
				mensaje="Los cambios de esta nota se perderán."
				textoConfirmar="Salir sin guardar"
				peligroso
				onCancelar={() => salida.reset?.()}
				onConfirmar={() => salida.proceed?.()}
			/>
		</form.AppForm>
	);
}
