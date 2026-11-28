import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { usePermisos } from "@/core/auth/usePermisos";
import { ConfirmDialog } from "@/core/components/ui/ConfirmDialog";
import type { CarpetaDto, NotaIndiceDto } from "../api/notasApi";
import type { ContextoNotaSearch } from "../schemas/notaSchemas";
import {
	useActualizarCarpetaMutation,
	useEliminarCarpetaMutation,
} from "../hooks/useCarpetas";
import {
	useDuplicarNotaMutation,
	useFijarNotaMutation,
	useMoverNotaMutation,
} from "../hooks/useNotasMutation";
import { useDescargarCarpeta } from "../hooks/useDescargarCarpeta";
import type { EstadoCarpetaDialog } from "./CarpetaDialog";
import { type Arrastrado, ExploradorCarpeta } from "./ExploradorCarpeta";
import { type Moviendo, MoverDialog } from "./MoverDialog";

interface PanelCarpetasProps {
	carpetas: CarpetaDto[];
	notas: NotaIndiceDto[];
	/** Contexto con el que se abren las notas. */
	searchNota: ContextoNotaSearch;
	proyectoId?: number;
	seleccionada?: number;
	onSeleccionar: (carpetaId?: number) => void;
	onAbrirCarpetaDialog: (estado: EstadoCarpetaDialog) => void;
}

/** Explorador de carpetas y notas con crear, editar, eliminar, descargar y mover. */
export function PanelCarpetas({
	carpetas,
	notas,
	searchNota,
	proyectoId,
	seleccionada,
	onSeleccionar,
	onAbrirCarpetaDialog,
}: PanelCarpetasProps) {
	const { puede } = usePermisos();
	const [eliminando, setEliminando] = useState<CarpetaDto | null>(null);
	const [moviendo, setMoviendo] = useState<Moviendo>();
	const eliminar = useEliminarCarpetaMutation();
	const descargar = useDescargarCarpeta(carpetas, proyectoId);
	const moverNota = useMoverNotaMutation();
	const duplicarNota = useDuplicarNotaMutation();
	const fijarNota = useFijarNotaMutation();
	const moverCarpeta = useActualizarCarpetaMutation();
	const navigate = useNavigate();
	const mover = ({ tipo, id }: Arrastrado, destino: number | null) => {
		if (tipo === "nota") {
			const nota = notas.find((n) => n.id === id);
			if (nota && nota.carpetaId !== destino)
				moverNota.mutate({ id, carpetaId: destino });
			return;
		}
		const carpeta = carpetas.find((c) => c.id === id);
		if (carpeta && carpeta.padreId !== destino)
			moverCarpeta.mutate({ id, datos: { padreId: destino } });
	};

	return (
		<>
			<ExploradorCarpeta
				carpetas={carpetas}
				notas={notas}
				searchNota={searchNota}
				seleccionada={seleccionada}
				onSeleccionar={onSeleccionar}
				editable={puede("notas:crear")}
				onNuevaNota={(carpetaId) =>
					navigate({
						to: "/notas/nueva",
						search: { ...searchNota, carpetaId: carpetaId ?? undefined },
					})
				}
				onNueva={(padreId) => onAbrirCarpetaDialog({ padreId })}
				onEditar={(carpeta) =>
					onAbrirCarpetaDialog({ carpeta, padreId: carpeta.padreId })
				}
				onEliminar={setEliminando}
				onDescargar={(carpeta) => descargar.mutate(carpeta)}
				onMover={mover}
				onMoverA={setMoviendo}
				onDuplicarNota={
					puede("notas:crear")
						? (nota) => duplicarNota.mutate(nota.id)
						: undefined
				}
				onFijarNota={
					puede("notas:actualizar")
						? (nota) =>
								fijarNota.mutate({ id: nota.id, isFijada: !nota.isFijada })
						: undefined
				}
			/>
			<MoverDialog
				moviendo={moviendo}
				carpetas={carpetas}
				onMover={mover}
				onCerrar={() => setMoviendo(undefined)}
			/>
			<ConfirmDialog
				abierto={eliminando !== null}
				titulo={`¿Eliminar «${eliminando?.nombre}»?`}
				mensaje="Sus notas y subcarpetas no se borran: pasan a la carpeta superior."
				textoConfirmar="Eliminar"
				peligroso
				isLoading={eliminar.isPending}
				onCancelar={() => setEliminando(null)}
				onConfirmar={() =>
					eliminando &&
					eliminar.mutate(eliminando.id, {
						onSuccess: () => {
							if (eliminando.id === seleccionada)
								onSeleccionar(eliminando.padreId ?? undefined);
							setEliminando(null);
						},
					})
				}
			/>
		</>
	);
}
