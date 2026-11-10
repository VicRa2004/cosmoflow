import { strFromU8 } from "fflate";
import { describe, expect, it } from "vitest";
import type { CarpetaDto, NotaDto } from "../api/notasApi";
import { contenidoDe, ordenEnArbol, rutaDe, subarbol } from "./arbolCarpetas";
import { archivosZip } from "./exportar";
import { enLotes, leerArchivosObsidian } from "./obsidian";

const carpeta = (id: number, nombre: string, padreId: number | null) =>
	({ id, nombre, padreId, icono: null, color: null }) as CarpetaDto;
// Viajes › Europa, y Trabajo suelta.
const carpetas = [
	carpeta(1, "Viajes", null),
	carpeta(2, "Europa", 1),
	carpeta(3, "Trabajo", null),
];
const nota = (titulo: string, carpetaId: number | null) =>
	({ titulo, carpetaId, contenido: `# ${titulo}` }) as NotaDto;

describe("árbol de carpetas", () => {
	it("ruta, subárbol y orden en profundidad con nivel", () => {
		expect(rutaDe(2, carpetas)).toEqual(["Viajes", "Europa"]);
		expect(rutaDe(null, carpetas)).toEqual([]);
		expect([...subarbol(1, carpetas)]).toEqual([1, 2]);
		expect(
			ordenEnArbol(carpetas).map(({ carpeta, nivel }) => [
				carpeta.nombre,
				nivel,
			]),
		).toEqual([
			["Viajes", 0],
			["Europa", 1],
			["Trabajo", 0],
		]);
	});
});

describe("archivosZip", () => {
	const notas = [
		nota("Lisboa", 2),
		nota("Lisboa", 2),
		nota("Plan/Q1", 3),
		nota("Suelta", null),
	];

	it("una carpeta: rutas relativas a ella, sin lo de fuera y sin pisar nombres", () => {
		const archivos = archivosZip(notas, carpetas, 1);
		expect(Object.keys(archivos)).toEqual([
			"Viajes/Europa/Lisboa.md",
			"Viajes/Europa/Lisboa (2).md",
		]);
		expect(strFromU8(archivos["Viajes/Europa/Lisboa.md"] as Uint8Array)).toBe(
			"# Lisboa",
		);
	});

	it("todo el ámbito, con nombres de archivo válidos", () => {
		expect(Object.keys(archivosZip(notas, carpetas, null))).toContain(
			"Trabajo/Plan-Q1.md",
		);
	});
});

describe("leerArchivosObsidian", () => {
	const archivo = (ruta: string, texto = "x") => {
		const f = new File([texto], ruta.split("/").at(-1) as string);
		Object.defineProperty(f, "webkitRelativePath", { value: ruta });
		return f;
	};

	it("conserva carpetas y contenido y salta lo oculto y lo que no es .md", async () => {
		const { notas, omitidas } = await leerArchivosObsidian([
			archivo("Vault/Ideas/App.md", "Ver [[Otra]]"),
			archivo("Vault/.obsidian/config.md"),
			archivo("Vault/foto.png"),
			archivo("Vault/Grande.md", "a".repeat(100_001)),
		]);
		expect(notas).toEqual([
			{ carpeta: ["Vault", "Ideas"], titulo: "App", contenido: "Ver [[Otra]]" },
		]);
		expect(omitidas).toEqual(["Grande.md"]);
	});

	it("trocea en lotes", () => {
		expect(enLotes([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]]);
	});
});

describe("contenidoDe", () => {
	const carpetas = [
		{ id: 1, nombre: "A", padreId: null },
		{ id: 2, nombre: "B", padreId: 1 },
		{ id: 3, nombre: "C", padreId: null },
	];
	const nota = (titulo: string, carpetaId: number | null) => ({
		titulo,
		carpetaId,
	});
	const notas = [
		nota("zeta", null),
		nota("en A", 1),
		nota("en B", 2),
		nota("huérfana", 99),
	];
	const nombres = (carpetaId: number | null) => {
		const c = contenidoDe(carpetaId, carpetas, notas);
		return [
			...c.carpetas.map((x) => `${x.nombre}/`),
			...c.notas.map((x) => x.titulo),
		];
	};

	it("solo lo que cuelga directamente de la carpeta, por nombre", () => {
		expect(nombres(null)).toEqual(["A/", "C/", "huérfana", "zeta"]);
		expect(nombres(1)).toEqual(["B/", "en A"]);
		expect(nombres(2)).toEqual(["en B"]);
	});
});
