import { describe, expect, it } from "vitest";
import { aSearch, aValor } from "./SelectorContextoTareas";

describe("SelectorContextoTareas", () => {
	it.each([
		[{}, ""],
		[{ asignadas: true as const }, "asignadas"],
		[{ organizacionId: 1 }, "o:1"],
		[{ organizacionId: 1, equipoId: 5 }, "e:1:5"],
		[{ organizacionId: 1, proyectoId: 2 }, "p:1:2"],
	])("%o ↔ %s", (search, valor) => {
		expect(aValor(search)).toBe(valor);
		expect(aSearch(valor)).toEqual(search);
	});
});
