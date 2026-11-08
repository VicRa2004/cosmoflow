import { strToU8, zipSync } from "fflate";
import type { CarpetaDto, NotaDto } from "../api/notasApi";
import { rutaDe, subarbol } from "./arbolCarpetas";

/** Sin los caracteres que Windows, macOS o Linux no admiten en un nombre de archivo. */
export const nombreArchivo = (nombre: string) =>
	nombre.replace(/[\\/:*?"<>|]/g, "-").trim() || "Sin título";

function descargar(contenido: BlobPart, nombre: string, tipo: string) {
	const url = URL.createObjectURL(new Blob([contenido], { type: tipo }));
	const a = document.createElement("a");
	a.href = url;
	a.download = nombre;
	a.click();
	URL.revokeObjectURL(url);
}

export function descargarNotaMd(nota: Pick<NotaDto, "titulo" | "contenido">) {
	descargar(
		nota.contenido,
		`${nombreArchivo(nota.titulo)}.md`,
		"text/markdown;charset=utf-8",
	);
}

/**
 * Archivos `.md` con la ruta de carpetas relativa a `raizId` (sin ella, todo el
 * ámbito), listos para Obsidian. Un nombre repetido recibe « (2)», « (3)»…
 */
export function archivosZip(
	notas: NotaDto[],
	carpetas: CarpetaDto[],
	raizId: number | null,
): Record<string, Uint8Array> {
	const dentro = raizId === null ? null : subarbol(raizId, carpetas);
	const prefijo = raizId === null ? 0 : rutaDe(raizId, carpetas).length - 1;
	const archivos: Record<string, Uint8Array> = {};
	for (const nota of notas) {
		if (dentro && (nota.carpetaId === null || !dentro.has(nota.carpetaId)))
			continue;
		const carpeta = rutaDe(nota.carpetaId, carpetas)
			.slice(prefijo)
			.map(nombreArchivo);
		const base = [...carpeta, nombreArchivo(nota.titulo)].join("/");
		let ruta = `${base}.md`;
		for (let n = 2; ruta in archivos; n++) ruta = `${base} (${n}).md`;
		archivos[ruta] = strToU8(nota.contenido);
	}
	return archivos;
}

export function descargarZip(
	archivos: Record<string, Uint8Array>,
	nombre: string,
) {
	descargar(
		zipSync(archivos) as Uint8Array<ArrayBuffer>,
		`${nombreArchivo(nombre)}.zip`,
		"application/zip",
	);
}
