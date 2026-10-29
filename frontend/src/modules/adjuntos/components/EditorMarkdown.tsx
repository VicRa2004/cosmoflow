import { ImagePlus } from "lucide-react";
import { type ClipboardEvent, useRef, useState } from "react";
import { CampoAreaTexto } from "@/core/components/form/campos";
import { useFieldContext } from "@/core/components/form/contextos";
import { Button } from "@/core/components/ui/Button";
import { cn } from "@/core/utils/cn";
import { useSubirAdjuntoMutation } from "../hooks/useSubirAdjuntoMutation";
import { ContenidoMarkdown } from "./ContenidoMarkdown";

const TIPOS = "image/png,image/jpeg,image/webp";

interface EditorMarkdownProps {
	label: string;
	placeholder?: string;
	className?: string;
}

/**
 * Campo de formulario markdown: escribir o ver la vista previa, e insertar
 * imágenes con el botón o pegándolas. Va dentro de `form.AppField`.
 */
export function EditorMarkdown({
	label,
	placeholder,
	className,
}: EditorMarkdownProps) {
	const campo = useFieldContext<string>();
	// Lo que ya tiene contenido se abre para leer; lo vacío, para escribir.
	const [vista, setVista] = useState<"escribir" | "previa">(
		campo.state.value ? "previa" : "escribir",
	);
	const subir = useSubirAdjuntoMutation();
	const input = useRef<HTMLInputElement>(null);

	const insertar = (archivo: File) =>
		subir.mutate(archivo, {
			onSuccess: ({ url }) => {
				// Corchetes fuera del texto alternativo: romperían el enlace.
				const alt = archivo.name.replace(/\.\w+$/, "").replace(/[[\]]/g, "");
				const imagen = `![${alt}](${url})\n`;
				// Con updater: el texto puede cambiar mientras se sube la imagen.
				campo.handleChange((texto) =>
					!texto || texto.endsWith("\n")
						? texto + imagen
						: `${texto}\n${imagen}`,
				);
			},
		});

	const pegar = (e: ClipboardEvent) => {
		const archivo = [...e.clipboardData.files].find((f) =>
			TIPOS.includes(f.type),
		);
		if (!archivo) return;
		e.preventDefault();
		insertar(archivo);
	};

	return (
		<div className="space-y-1">
			{vista === "escribir" ? (
				<div onPaste={pegar}>
					<CampoAreaTexto
						label={label}
						placeholder={placeholder}
						className={className}
					/>
				</div>
			) : (
				<div className="space-y-1.5">
					<span className="block text-[13px] font-medium text-tinta-suave">
						{label}
					</span>
					<ContenidoMarkdown
						className={cn(
							"min-h-28 rounded-lg border border-borde px-3.5 py-2",
							className,
						)}
					>
						{campo.state.value || "*Sin contenido*"}
					</ContenidoMarkdown>
				</div>
			)}
			<div className="flex items-center justify-between gap-2">
				<div className="flex gap-1">
					{(["escribir", "previa"] as const).map((modo) => (
						<Button
							key={modo}
							variant={vista === modo ? "secondary" : "ghost"}
							size="sm"
							aria-pressed={vista === modo}
							onClick={() => setVista(modo)}
						>
							{modo === "escribir" ? "Escribir" : "Vista previa"}
						</Button>
					))}
				</div>
				<input
					ref={input}
					type="file"
					accept={TIPOS}
					className="hidden"
					aria-label="Imagen a insertar"
					onChange={(e) => {
						const archivo = e.target.files?.[0];
						e.target.value = "";
						if (archivo) insertar(archivo);
					}}
				/>
				<Button
					variant="ghost"
					size="sm"
					onClick={() => input.current?.click()}
					isLoading={subir.isPending}
				>
					<ImagePlus className="h-4 w-4" />
					Insertar imagen
				</Button>
			</div>
		</div>
	);
}
