import { describe, expect, it } from "bun:test";
import { concordar, esFemenino, plural } from "./nombres";

describe("nombres de los generadores", () => {
	it.each([
		["producto", "productos"],
		["nota", "notas"],
		["tag", "tags"],
		["usuario", "usuarios"],
		["organizacion", "organizaciones"],
		["rol", "roles"],
		["luz", "luces"],
		["ordenCompra", "ordenCompras"],
	])("plural(%s) = %s", (singular, esperado) => {
		expect(plural(singular)).toBe(esperado);
	});

	it.each([
		["nota", true],
		["tarea", true],
		["organizacion", true],
		["ciudad", true],
		["ordenCompra", true],
		["producto", false],
		["tag", false],
		["tema", false],
		["equipo", false],
	])("esFemenino(%s) = %s", (nombre, esperado) => {
		expect(esFemenino(nombre)).toBe(esperado);
	});

	it("los flags fuerzan el género", () => {
		expect(esFemenino("mano", ["--femenino"])).toBe(true);
		expect(esFemenino("nota", ["--masculino"])).toBe(false);
	});

	it("concuerda solo en femenino", () => {
		expect(concordar("no encontrado", true)).toBe("no encontrada");
		expect(concordar("Nuevo", false)).toBe("Nuevo");
	});
});
