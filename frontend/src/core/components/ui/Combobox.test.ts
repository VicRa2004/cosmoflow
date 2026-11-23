import { describe, expect, it } from "vitest";
import { alternar, filtrarOpciones, sePuedeCrear } from "./Combobox";

const opciones = [
	{ id: 1, etiqueta: "Victor Raúl" },
	{ id: 2, etiqueta: "Gerardo Navarro" },
	{ id: 3, etiqueta: "Marcos Cárdenas" },
];

describe("filtrarOpciones", () => {
	it.each([
		["", [1, 2, 3]],
		["  ", [1, 2, 3]],
		["raul", [1]],
		["CARDENAS", [3]],
		["ar", [2, 3]],
		["nadie", []],
	])("«%s» → %o", (texto, ids) => {
		expect(filtrarOpciones(opciones, texto).map((o) => o.id)).toEqual(ids);
	});
});

describe("alternar", () => {
	it("añade el id si no está", () => {
		expect(alternar([1], 2)).toEqual([1, 2]);
	});

	it("quita el id si ya está", () => {
		expect(alternar([1, 2], 1)).toEqual([2]);
	});
});

describe("sePuedeCrear", () => {
	it.each([
		["", false],
		["   ", false],
		["victor raul", false],
		["Victor", true],
		["Nuevo tag", true],
	])("«%s» → %s", (texto, esperado) => {
		expect(sePuedeCrear(opciones, texto)).toBe(esperado);
	});
});
