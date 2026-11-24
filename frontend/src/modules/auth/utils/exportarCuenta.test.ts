import { strFromU8 } from "fflate";
import { describe, expect, it } from "vitest";
import type { DatosExportados } from "../api/authApi";
import { archivosExportacion, tareasCsv } from "./exportarCuenta";

const tarea: DatosExportados["tareas"][number] = {
	id: 1,
	titulo: 'Comprar "pan", leche',
	contenido: "línea 1\nlínea 2",
	estado: "pendiente",
	prioridad: "media",
	fechaInicio: null,
	fechaVencimiento: null,
	organizacionId: null,
	equipoId: null,
	proyectoId: null,
	subtareas: [],
	createdAt: "2026-11-24T10:00:00.000Z",
	updatedAt: null,
};

describe("tareasCsv", () => {
	it("escapa comillas, comas y saltos de línea", () => {
		const [cabecera, fila] = tareasCsv([tarea]).split("\r\n");
		expect(cabecera?.startsWith("id,titulo,estado")).toBe(true);
		expect(fila).toBe(
			'1,"Comprar ""pan"", leche",pendiente,media,,,,,,2026-11-24T10:00:00.000Z,,"línea 1\nlínea 2"',
		);
	});
});

describe("archivosExportacion", () => {
	it("pone las notas en notas/ con sus carpetas y las tareas en JSON y CSV", () => {
		const archivos = archivosExportacion({
			tareas: [tarea],
			notas: [
				{
					id: 1,
					titulo: "Diario",
					contenido: "# Hola",
					carpetaId: 7,
					organizacionId: null,
					proyectoId: null,
					createdAt: "2026-11-24T10:00:00.000Z",
					updatedAt: "2026-11-24T10:00:00.000Z",
				},
			],
			carpetas: [{ id: 7, nombre: "Personal", padreId: null }],
		});
		expect(Object.keys(archivos).sort()).toEqual([
			"notas/Personal/Diario.md",
			"tareas.csv",
			"tareas.json",
		]);
		expect(
			JSON.parse(strFromU8(archivos["tareas.json"] as Uint8Array)),
		).toEqual([tarea]);
	});
});
