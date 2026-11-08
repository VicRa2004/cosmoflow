import { FileText, FolderOpen } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/core/components/ui/Button";
import { Dialog } from "@/core/components/ui/Dialog";
import type { ImportarNotasInput } from "../api/notasApi";
import { useImportarNotasMutation } from "../hooks/useCarpetas";
import { enLotes, leerArchivosObsidian } from "../utils/obsidian";

interface ImportarObsidianDialogProps {
	abierto: boolean;
	onCerrar: () => void;
	proyectoId?: number;
	/** Carpeta donde se importa; sin ella, en la raíz. */
	carpetaId?: number;
	nombreDestino: string;
}

/** Importa `.md` sueltos o una carpeta entera (vault) de Obsidian conservando su árbol. */
export function ImportarObsidianDialog({
	abierto,
	onCerrar,
	proyectoId,
	carpetaId,
	nombreDestino,
}: ImportarObsidianDialogProps) {
	const importar = useImportarNotasMutation();
	const [notas, setNotas] = useState<ImportarNotasInput["notas"]>([]);
	const [omitidas, setOmitidas] = useState<string[]>([]);
	const [progreso, setProgreso] = useState<string | null>(null);

	const elegir = async (archivos: FileList | null) => {
		const leidas = await leerArchivosObsidian([...(archivos ?? [])]);
		setNotas(leidas.notas);
		setOmitidas(leidas.omitidas);
	};
	const cerrar = () => {
		setNotas([]);
		setOmitidas([]);
		onCerrar();
	};
	const enviar = async () => {
		const lotes = enLotes(notas);
		let carpetas = 0;
		try {
			for (const [i, lote] of lotes.entries()) {
				setProgreso(`Importando lote ${i + 1} de ${lotes.length}…`);
				// Secuencial: cada lote reutiliza las carpetas que creó el anterior.
				carpetas += (
					await importar.mutateAsync({ notas: lote, proyectoId, carpetaId })
				).carpetas;
			}
			toast.success(`${notas.length} notas y ${carpetas} carpetas importadas`);
			cerrar();
		} catch {
			// El toast lo da la mutación; los lotes anteriores ya quedaron guardados.
		} finally {
			setProgreso(null);
		}
	};

	const input = "sr-only";
	return (
		<Dialog
			abierto={abierto}
			onCerrar={cerrar}
			titulo="Importar de Obsidian"
			descripcion={`Las notas se crean en «${nombreDestino}» con sus subcarpetas. Los [[wikilinks]] se conservan.`}
		>
			<div className="space-y-4">
				<div className="flex flex-wrap gap-2">
					<label className="cursor-pointer">
						<input
							type="file"
							accept=".md,text/markdown"
							multiple
							className={input}
							onChange={(e) => elegir(e.target.files)}
						/>
						<span className="inline-flex h-9 items-center gap-2 rounded-md border border-borde-fuerte px-3 text-sm text-tinta hover:bg-elevada">
							<FileText className="h-4 w-4" /> Archivos .md
						</span>
					</label>
					<label className="cursor-pointer">
						<input
							type="file"
							// Selector de carpeta: Chrome, Edge, Firefox y Safari.
							{...{ webkitdirectory: "" }}
							className={input}
							onChange={(e) => elegir(e.target.files)}
						/>
						<span className="inline-flex h-9 items-center gap-2 rounded-md border border-borde-fuerte px-3 text-sm text-tinta hover:bg-elevada">
							<FolderOpen className="h-4 w-4" /> Carpeta o vault
						</span>
					</label>
				</div>
				{notas.length > 0 && (
					<p className="text-sm text-tinta-suave">
						{notas.length} notas listas para importar.
					</p>
				)}
				{omitidas.length > 0 && (
					<p className="text-sm text-amber-400">
						Se omiten por superar 100 000 caracteres: {omitidas.join(", ")}
					</p>
				)}
				<div className="flex items-center justify-end gap-3">
					{progreso && (
						<span className="text-sm text-tinta-tenue">{progreso}</span>
					)}
					<Button
						onClick={enviar}
						disabled={notas.length === 0}
						isLoading={progreso !== null}
					>
						Importar
					</Button>
				</div>
			</div>
		</Dialog>
	);
}
