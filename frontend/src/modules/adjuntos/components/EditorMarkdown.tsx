import { Crepe } from "@milkdown/crepe";
import "@milkdown/crepe/theme/common/style.css";
import { useEffect, useRef } from "react";
import { useFieldContext } from "@/core/components/form/contextos";
import { cn } from "@/core/utils/cn";
import { type AmbitoAdjunto, adjuntosApi } from "../api/adjuntosApi";
import { useSubirAdjuntoMutation } from "../hooks/useSubirAdjuntoMutation";

interface EditorMarkdownProps {
	label: string;
	placeholder?: string;
	className?: string;
	/** En una tarea o nota compartida: las imágenes se comparten con sus miembros. */
	ambito?: AmbitoAdjunto;
}

/**
 * Campo markdown tipo Notion (Milkdown Crepe): `/` abre el menú de bloques, al
 * seleccionar texto sale la barra de formato e insertar o pegar una imagen la sube
 * a `/api/adjuntos`. Guarda markdown. Va dentro de `form.AppField`.
 */
export function EditorMarkdown({
	label,
	placeholder,
	className,
	ambito,
}: EditorMarkdownProps) {
	const campo = useFieldContext<string>();
	const raiz = useRef<HTMLFieldSetElement>(null);
	const subir = useSubirAdjuntoMutation(ambito);
	// Crepe guarda los callbacks al crearse: los refs le dan siempre los actuales.
	const subirRef = useRef(subir.mutateAsync);
	subirRef.current = subir.mutateAsync;
	const cambiarRef = useRef(campo.handleChange);
	cambiarRef.current = campo.handleChange;

	// biome-ignore lint/correctness/useExhaustiveDependencies: el valor inicial se lee una vez; después manda el editor
	useEffect(() => {
		const crepe = new Crepe({
			root: raiz.current,
			defaultValue: campo.state.value,
			features: { [Crepe.Feature.Latex]: false },
			featureConfigs: {
				[Crepe.Feature.Placeholder]: {
					text: placeholder ?? "Escribe o pulsa «/» para insertar un bloque…",
				},
				[Crepe.Feature.ImageBlock]: {
					onUpload: async (archivo) => (await subirRef.current(archivo)).url,
					// shortcut: el blob URL no se libera hasta recargar; basta para una sesión de edición.
					proxyDomURL: async (url) =>
						url.startsWith("/api/adjuntos/")
							? URL.createObjectURL(await adjuntosApi.descargar(url))
							: url,
					blockUploadButton: "Subir imagen",
					blockConfirmButton: "Confirmar",
					blockCaptionPlaceholderText: "Pie de imagen",
					blockUploadPlaceholderText: "o pega un enlace",
					inlineUploadPlaceholderText: "o pega un enlace",
				},
				[Crepe.Feature.BlockEdit]: {
					textGroup: {
						label: "Texto",
						text: { label: "Texto" },
						h1: { label: "Título 1" },
						h2: { label: "Título 2" },
						h3: { label: "Título 3" },
						h4: { label: "Título 4" },
						h5: { label: "Título 5" },
						h6: { label: "Título 6" },
						quote: { label: "Cita" },
						divider: { label: "Separador" },
					},
					listGroup: {
						label: "Listas",
						bulletList: { label: "Lista" },
						orderedList: { label: "Lista numerada" },
						taskList: { label: "Lista de tareas" },
					},
					advancedGroup: {
						label: "Avanzado",
						image: { label: "Imagen" },
						codeBlock: { label: "Código" },
						table: { label: "Tabla" },
					},
				},
				[Crepe.Feature.Toolbar]: {
					boldLabel: "Negrita",
					italicLabel: "Cursiva",
					strikethroughLabel: "Tachado",
					codeLabel: "Código",
					linkLabel: "Enlace",
				},
			},
		});
		crepe.on((api) =>
			api.markdownUpdated((_ctx, markdown) => cambiarRef.current(markdown)),
		);
		const creado = crepe.create();
		return () => {
			creado.then(() => crepe.destroy());
		};
	}, []);

	return (
		<fieldset
			ref={raiz}
			aria-label={label}
			className={cn("editor-markdown min-w-0", className)}
		/>
	);
}
