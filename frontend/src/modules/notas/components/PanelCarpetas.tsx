import { useState } from "react";
import { usePermisos } from "@/core/auth/usePermisos";
import { ConfirmDialog } from "@/core/components/ui/ConfirmDialog";
import type { CarpetaDto, NotaDto } from "../api/notasApi";
import type { ContextoNotaSearch } from "../schemas/notaSchemas";
import { useEliminarCarpetaMutation } from "../hooks/useCarpetas";
import { useDescargarCarpeta } from "../hooks/useDescargarCarpeta";
import { ArbolCarpetas } from "./ArbolCarpetas";
import { CarpetaDialog } from "./CarpetaDialog";

interface PanelCarpetasProps {
	carpetas: CarpetaDto[];
	notas: NotaDto[];
	notaAbierta?: number;
	/** Contexto con el que se abren las notas. */
	searchNota: ContextoNotaSearch;
	proyectoId?: number;
	seleccionada?: number;
	onSeleccionar: (carpetaId?: number) => void;
}

/** Árbol de carpetas y notas con crear, editar, eliminar y descargar. */
export function PanelCarpetas({
	carpetas,
	notas,
	notaAbierta,
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

	return (
		<>
			<ArbolCarpetas
				carpetas={carpetas}
				notas={notas}
				notaAbierta={notaAbierta}
				searchNota={searchNota}
				seleccionada={seleccionada}
				onSeleccionar={onSeleccionar}
				editable={puede("notas:crear")}
				onNueva={(padreId) => setDialogo({ padreId })}
				onEditar={(carpeta) =>
					setDialogo({ carpeta, padreId: carpeta.padreId })
				}
				onEliminar={setEliminando}
				onDescargar={(carpeta) => descargar.mutate(carpeta)}
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
