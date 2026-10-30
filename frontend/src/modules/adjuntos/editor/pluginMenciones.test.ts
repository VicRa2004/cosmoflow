import { describe, expect, it } from "vitest";
import { filtrarMencionables } from "./pluginMenciones";

const personas = [
	{ id: 1, nombre: "Ana López" },
	{ id: 2, nombre: "Íñigo Pérez" },
	{ id: 3, nombre: "Beto" },
];

describe("filtrarMencionables", () => {
	it("busca en cualquier parte del nombre, sin mayúsculas ni tildes", () => {
		expect(filtrarMencionables(personas, "lopez")).toEqual([personas[0]]);
		expect(filtrarMencionables(personas, "INI")).toEqual([personas[1]]);
	});

	it("con `@` solo, ofrece a todos (hasta 6)", () => {
		expect(filtrarMencionables(personas, "")).toHaveLength(3);
	});
});
