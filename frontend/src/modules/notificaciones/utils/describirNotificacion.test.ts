import { describe, expect, it } from "vitest";
import { describirResponsables } from "./describirNotificacion";

const ana = { id: 1, nombre: "Ana" };
const beto = { id: 2, nombre: "Beto" };

describe("describirResponsables", () => {
	it("muestra encargado y quién asignó, con «tú» para quien mira", () => {
		expect(
			describirResponsables([{ ...beto, asignadoPor: ana }], beto.id),
		).toEqual({ encargado: "tú", asigno: "Ana" });
	});

	it("dice «la misma persona» si se lo asignó a sí mismo", () => {
		expect(describirResponsables([{ ...ana, asignadoPor: ana }])).toEqual({
			encargado: "Ana",
			asigno: "la misma persona",
		});
	});

	it("sin responsables o sin asignador conocido", () => {
		expect(describirResponsables([])).toEqual({
			encargado: "Sin encargado",
			asigno: null,
		});
		expect(
			describirResponsables([
				{ ...ana, asignadoPor: beto },
				{ ...beto, asignadoPor: null },
			]),
		).toEqual({ encargado: "Ana, Beto", asigno: "Beto" });
	});
});
