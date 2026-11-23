import { describe, expect, it } from "bun:test";
import { permiteAlcance } from "./alcances";

describe("permiteAlcance", () => {
	const lectura = ["tareas:leer"];

	it("leer deja los GET de su área y nada más", () => {
		expect(permiteAlcance(lectura, "GET", "/api/tareas/pendientes")).toBe(true);
		expect(permiteAlcance(lectura, "PUT", "/api/tareas/3")).toBe(false);
		expect(permiteAlcance(lectura, "GET", "/api/notas")).toBe(false);
	});

	it("escribir incluye leer", () => {
		const escritura = ["notas:escribir"];
		expect(permiteAlcance(escritura, "GET", "/api/notas/1")).toBe(true);
		expect(permiteAlcance(escritura, "DELETE", "/api/carpetas/2")).toBe(true);
	});

	it("las subrutas de organización van a su área, no a organizaciones", () => {
		expect(
			permiteAlcance(lectura, "GET", "/api/organizaciones/1/plantillas"),
		).toBe(true);
		expect(permiteAlcance(lectura, "GET", "/api/organizaciones/1")).toBe(false);
		expect(
			permiteAlcance(
				["organizaciones:leer"],
				"GET",
				"/api/organizaciones/1/proyectos",
			),
		).toBe(true);
	});

	it("niega lo que no es de ningún área y no limita fuera de /api", () => {
		expect(permiteAlcance(lectura, "GET", "/api/usuarios")).toBe(false);
		expect(permiteAlcance(lectura, "GET", "/api/tareasx")).toBe(false);
		expect(permiteAlcance(lectura, "POST", "/mcp")).toBe(true);
	});
});
