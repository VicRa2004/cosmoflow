import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { getErrorMessage } from "@/core/api/client";
import { type CarpetaDto, type NotaDto, notasApi } from "../api/notasApi";
import { archivosZip, descargarZip } from "../utils/exportar";

// shortcut: trae todas las notas del ámbito y filtra en el cliente; con miles de notas, pasar a un endpoint de exportación.
const todasLasNotas = (proyectoId?: number): Promise<NotaDto[]> =>
	notasApi.obtenerTodas({ proyectoId });

/** Descarga una carpeta (con subcarpetas) o todo el ámbito como `.zip` de `.md`. */
export function useDescargarCarpeta(
	carpetas: CarpetaDto[],
	proyectoId?: number,
) {
	return useMutation({
		mutationFn: async (carpeta: CarpetaDto | null) => {
			const archivos = archivosZip(
				await todasLasNotas(proyectoId),
				carpetas,
				carpeta?.id ?? null,
			);
			if (Object.keys(archivos).length === 0) {
				toast.info("No hay notas que descargar");
				return;
			}
			descargarZip(archivos, carpeta?.nombre ?? "Notas");
		},
		onError: (error) => toast.error(getErrorMessage(error)),
	});
}
