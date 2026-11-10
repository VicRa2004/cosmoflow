import { useStore } from "@tanstack/react-form";
import { ArrowLeft, ChevronRight } from "lucide-react";
import { type ReactNode, useEffect, useRef } from "react";
import { useAppForm } from "@/core/components/form/useAppForm";
import { useAtajoGuardar } from "@/core/components/form/useAtajoGuardar";
import { Button } from "@/core/components/ui/Button";
import { Kbd } from "@/core/components/ui/Kbd";
import { cn } from "@/core/utils/cn";
import { EditorMarkdown } from "@/modules/adjuntos/components/EditorMarkdown";
import { SelectorTags } from "@/modules/tags/components/SelectorTags";
import type { NotaDto } from "../api/notasApi";
import { useCarpetasQuery } from "../hooks/useCarpetas";
import {
	useAutoguardarNotaMutation,
	useCrearNotaMutation,
} from "../hooks/useNotasMutation";
import {
	type ContextoNotaSearch,
	notaAFormValues,
	notaFormSchema,
	notaFormVacio,
} from "../schemas/notaSchemas";
import { ordenEnArbol, rutaDe } from "../utils/arbolCarpetas";

const ESPERA_AUTOGUARDADO_MS = 1000;

interface NotaFormProps {
	/** Sin `inicial` crea con botón; con él, se guarda sola mientras se escribe. */
	inicial?: NotaDto;
	/** Al crear: proyecto donde va (sin él, personal). */
	contexto?: ContextoNotaSearch;
	onCreada?: (nota: NotaDto) => void;
	onVolver: () => void;
	/** Botones de la cabecera (descargar, eliminar…). */
	acciones?: ReactNode;
}

/** Documento de una nota como en Obsidian: título, propiedades plegadas y el editor. */
export function NotaForm({
	inicial,
	contexto,
	onCreada,
	onVolver,
	acciones,
}: NotaFormProps) {
	const crear = useCrearNotaMutation();
	const autoguardar = useAutoguardarNotaMutation();
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
		onSubmit: async ({ value }) => {
			if (inicial) return guardarRef.current();
			const datos = notaFormSchema.parse(value);
			const creada = await crear.mutateAsync(
				proyectoId ? { ...datos, proyectoId } : datos,
			);
			onCreada?.(creada);
		},
	});

	const valores = useStore(form.store, (estado) => estado.values);
	const ultimoGuardado = useRef(JSON.stringify(valores));
	const guardar = () => {
		if (!inicial) return;
		const { values } = form.state;
		const json = JSON.stringify(values);
		const datos = notaFormSchema.safeParse(values);
		if (json === ultimoGuardado.current || !datos.success) return;
		ultimoGuardado.current = json;
		autoguardar.mutate(
			{ id: inicial.id, datos: datos.data },
			// Vacío: el siguiente cambio (o Ctrl+S) lo reintenta.
			{ onError: () => (ultimoGuardado.current = "") },
		);
	};
	const guardarRef = useRef(guardar);
	guardarRef.current = guardar;

	// biome-ignore lint/correctness/useExhaustiveDependencies: cada cambio de `valores` reinicia la espera
	useEffect(() => {
		const espera = setTimeout(
			() => guardarRef.current(),
			ESPERA_AUTOGUARDADO_MS,
		);
		return () => clearTimeout(espera);
	}, [valores]);
	// Al cambiar de nota no se pierde lo escrito durante la espera.
	useEffect(() => () => guardarRef.current(), []);

	useAtajoGuardar(() => {
		if (inicial) guardar();
		else if (!form.state.isSubmitting) form.handleSubmit().catch(() => {});
	});

	const ruta = inicial ? rutaDe(inicial.carpetaId, carpetas) : [];
	const palabras = valores.contenido.split(/\s+/).filter(Boolean).length;
	const estado = !notaFormSchema.safeParse(valores).success
		? "Falta el título"
		: autoguardar.isError
			? "Error al guardar"
			: autoguardar.isPending ||
					JSON.stringify(valores) !== ultimoGuardado.current
				? "Guardando…"
				: "Guardado";

	return (
		<form.AppForm>
			<form.Formulario className="mx-auto max-w-3xl space-y-4">
				<div className="flex min-h-9 items-center justify-between gap-2">
					<div className="flex min-w-0 items-center gap-2">
						<Button
							variant="ghost"
							size="sm"
							onClick={onVolver}
							className={cn(inicial && "lg:hidden")}
						>
							<ArrowLeft className="h-4 w-4" />
							Volver
						</Button>
						{ruta.length > 0 && (
							<p className="truncate text-sm text-tinta-tenue">
								{ruta.join(" › ")}
							</p>
						)}
					</div>
					{inicial ? (
						<div className="flex shrink-0 items-center gap-1">
							<output className="mr-2 text-xs text-tinta-tenue">
								{estado} · {palabras} palabras
							</output>
							{acciones}
						</div>
					) : (
						<form.BotonEnviar>
							Crear
							<Kbd
								tecla="S"
								className="border-white/25 bg-white/15 text-white"
							/>
						</form.BotonEnviar>
					)}
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
		</form.AppForm>
	);
}
