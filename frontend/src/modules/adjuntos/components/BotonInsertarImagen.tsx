import { ImagePlus } from "lucide-react";
import { useRef } from "react";
import { Button } from "@/core/components/ui/Button";
import { useSubirAdjuntoMutation } from "../hooks/useSubirAdjuntoMutation";

interface BotonInsertarImagenProps {
	/** Con updater: el texto puede cambiar mientras se sube la imagen. */
	onChange: (actualizar: (contenido: string) => string) => void;
}

/** Sube una imagen y añade al final del contenido su markdown: `![nombre](/api/adjuntos/12)`. */
export function BotonInsertarImagen({ onChange }: BotonInsertarImagenProps) {
	const subir = useSubirAdjuntoMutation();
	const input = useRef<HTMLInputElement>(null);

	return (
		<>
			<input
				ref={input}
				type="file"
				accept="image/png,image/jpeg,image/webp"
				className="hidden"
				aria-label="Imagen a insertar"
				onChange={(e) => {
					const archivo = e.target.files?.[0];
					e.target.value = "";
					if (!archivo) return;
					subir.mutate(archivo, {
						onSuccess: ({ url }) => {
							// Corchetes fuera del texto alternativo: romperían el enlace.
							const alt = archivo.name
								.replace(/\.\w+$/, "")
								.replace(/[[\]]/g, "");
							const imagen = `![${alt}](${url})\n`;
							onChange((texto) =>
								!texto || texto.endsWith("\n")
									? texto + imagen
									: `${texto}\n${imagen}`,
							);
						},
					});
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
		</>
	);
}
