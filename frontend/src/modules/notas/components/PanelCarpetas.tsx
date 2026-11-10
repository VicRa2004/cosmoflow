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
import { useMoverNotaMutation } from "../hooks/useNotasMutation";
import { useDescargarCarpeta } from "../hooks/useDescargarCarpeta";
import { ExploradorCarpeta } from "./ExploradorCarpeta";
import { CarpetaDialog } from "./CarpetaDialog";

interface PanelCarpetasProps {
	carpetas: CarpetaDto[];
	notas: NotaIndiceDto[];
	/** Contexto con el que se abren las notas. */
	searchNota: ContextoNotaSearch;
	proyectoId?: number;
	seleccionada?: number;
	onSeleccionar: (carpetaId?: number) => void;
}

/** Explorador de carpetas y notas con crear, editar, eliminar, descargar y mover. */
export function PanelCarpetas({
	carpetas,
	notas,
	searchNota,
	proyectoId,
	seleccionada,
	onSeleccionar,
}: PanelCarpetasProps) {
	const { puede } = usePermisos();
	const [dialogo, setDialogo] = useState<{
		carpeta?: CarpetaDto;
		padreId: number | null;
	}>();
	const [eliminando, setEliminando] = useState<CarpetaDto | null>(null);
	const eliminar = useEliminarCarpetaMutation();
	const descargar = useDescargarCarpeta(carpetas, proyectoId);
	const moverNota = useMoverNotaMutation();
	const moverCarpeta = useActualizarCarpetaMutation();
	const navigate = useNavigate();

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
				onNueva={(padreId) => setDialogo({ padreId })}
				onEditar={(carpeta) =>
					setDialogo({ carpeta, padreId: carpeta.padreId })
				}
				onEliminar={setEliminando}
				onDescargar={(carpeta) => descargar.mutate(carpeta)}
				onMover={({ tipo, id }, destino) => {
					if (tipo === "nota") {
						const nota = notas.find((n) => n.id === id);
						if (nota && nota.carpetaId !== destino)
							moverNota.mutate({ id, carpetaId: destino });
						return;
					}
					const carpeta = carpetas.find((c) => c.id === id);
					if (carpeta && carpeta.padreId !== destino)
						moverCarpeta.mutate({ id, datos: { padreId: destino } });
				}}
			/>
			<CarpetaDialog
				estado={dialogo}
				carpetas={carpetas}
				proyectoId={proyectoId}
				onCerrar={() => setDialogo(undefined)}
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
