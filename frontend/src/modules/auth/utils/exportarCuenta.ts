import { strToU8 } from "fflate";
import { archivosZip } from "@/modules/notas/utils/exportar";
import type { DatosExportados } from "../api/authApi";

const COLUMNAS = [
	"id",
	"titulo",
	"estado",
	"prioridad",
	"fechaInicio",
	"fechaVencimiento",
	"organizacionId",
	"equipoId",
	"proyectoId",
	"createdAt",
	"updatedAt",
	"contenido",
] as const;

/** Celda CSV (RFC 4180): entre comillas si hace falta, con las comillas duplicadas. */
const celda = (valor: unknown) => {
	const texto = valor == null ? "" : String(valor);
	return /[",\r\n]/.test(texto) ? `"${texto.replaceAll('"', '""')}"` : texto;
};

export function tareasCsv(tareas: DatosExportados["tareas"]): string {
	const filas = tareas.map((t) => COLUMNAS.map((c) => celda(t[c])).join(","));
	return [COLUMNAS.join(","), ...filas].join("\r\n");
}

/** Notas en `.md` dentro de `notas/` (con sus carpetas) y tareas en JSON y CSV. */
export function archivosExportacion(
	datos: DatosExportados,
): Record<string, Uint8Array> {
	const archivos: Record<string, Uint8Array> = {
		"tareas.json": strToU8(JSON.stringify(datos.tareas, null, 2)),
		"tareas.csv": strToU8(tareasCsv(datos.tareas)),
	};
	for (const [ruta, bytes] of Object.entries(
		archivosZip(datos.notas, datos.carpetas, null),
	)) {
		archivos[`notas/${ruta}`] = bytes;
	}
	return archivos;
}
