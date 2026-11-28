import { Home } from "lucide-react";
import { useState } from "react";
import { Dialog } from "@/core/components/ui/Dialog";
import { Input } from "@/core/components/ui/Input";
import type { CarpetaDto } from "../api/notasApi";
import { ordenEnArbol, rutaDe, subarbol } from "../utils/arbolCarpetas";
import type { Arrastrado } from "./ExploradorCarpeta";
import { IconoCarpeta } from "./IconoCarpeta";

/** Qué se mueve y desde dónde (`null`: la raíz). */
export interface Moviendo extends Arrastrado {
	nombre: string;
	desde: number | null;
}

const opcion =
	"flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm text-tinta-suave hover:bg-elevada hover:text-tinta disabled:opacity-40 disabled:hover:bg-transparent";

/** «Mover a…» como el de Obsidian: carpetas filtrables por nombre o ruta. */
export function MoverDialog({
	moviendo,
	carpetas,
	onMover,
	onCerrar,
}: {
	moviendo?: Moviendo;
	carpetas: CarpetaDto[];
	onMover: (arrastrado: Arrastrado, destino: number | null) => void;
	onCerrar: () => void;
}) {
	const [filtro, setFiltro] = useState("");
	const cerrar = () => {
		setFiltro("");
		onCerrar();
	};
	const mover = (destino: number | null) => {
		if (moviendo) onMover(moviendo, destino);
		cerrar();
	};
	// Una carpeta no puede entrar en sí misma ni en una descendiente.
	const prohibidas =
		moviendo?.tipo === "carpeta"
			? subarbol(moviendo.id, carpetas)
			: new Set<number>();
	const texto = filtro.trim().toLocaleLowerCase("es");
	const destinos = ordenEnArbol(carpetas)
		.filter(({ carpeta }) => !prohibidas.has(carpeta.id))
		.map(({ carpeta, nivel }) => ({
			carpeta,
			nivel,
			ruta: rutaDe(carpeta.id, carpetas).join(" › "),
		}))
		.filter(({ ruta }) => ruta.toLocaleLowerCase("es").includes(texto));

	return (
		<Dialog
			abierto={moviendo !== undefined}
			onCerrar={cerrar}
			titulo={`Mover «${moviendo?.nombre ?? ""}» a…`}
		>
			<div className="space-y-3">
				<Input
					aria-label="Buscar carpeta"
					placeholder="Buscar carpeta..."
					value={filtro}
					onChange={(e) => setFiltro(e.target.value)}
					onKeyDown={(e) => {
						if (e.key === "Enter" && texto && destinos[0])
							mover(destinos[0].carpeta.id);
					}}
					autoFocus
				/>
				<div className="max-h-80 space-y-0.5 overflow-y-auto">
					{!texto && (
						<button
							type="button"
							className={opcion}
							disabled={moviendo?.desde === null}
							onClick={() => mover(null)}
						>
							<Home className="h-4 w-4 shrink-0" />
							Raíz
						</button>
					)}
					{destinos.map(({ carpeta, nivel, ruta }) => (
						<button
							key={carpeta.id}
							type="button"
							className={opcion}
							disabled={moviendo?.desde === carpeta.id}
							onClick={() => mover(carpeta.id)}
							// Con filtro se ve la ruta completa; sin él, el árbol con sangría.
							style={texto ? undefined : { paddingLeft: `${0.5 + nivel}rem` }}
						>
							<IconoCarpeta icono={carpeta.icono} />
							<span className="truncate">{texto ? ruta : carpeta.nombre}</span>
						</button>
					))}
					{texto && destinos.length === 0 && (
						<p className="px-2 py-1.5 text-sm text-tinta-tenue">
							Ninguna carpeta coincide.
						</p>
					)}
				</div>
			</div>
		</Dialog>
	);
}
