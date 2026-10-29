import { describe, expect, it } from "bun:test";
import { ProyectoInvalidoError } from "./error/ProyectoInvalidoError";
import { Proyecto } from "./Proyecto";

const datos = {
	nombre: "Lanzamiento",
	descripcion: "",
	estado: "activo" as const,
	equipoIds: [1],
	integranteIds: [],
};

describe("Proyecto", () => {
	it("no se crea sin equipo (RN-31)", () => {
		expect(() => Proyecto.crear(10, { ...datos, equipoIds: [] })).toThrow(
			ProyectoInvalidoError,
		);
	});

	it("no se queda sin equipos al editar", () => {
		const proyecto = Proyecto.crear(10, datos);
		expect(() => proyecto.actualizar({ equipoIds: [] })).toThrow(
			"al menos un equipo",
		);
		proyecto.actualizar({ equipoIds: [2, 2, 3], estado: "en_pausa" });
		expect(proyecto.getEquipoIds()).toEqual([2, 3]);
		expect(proyecto.getEstado()).toBe("en_pausa");
	});

	it("los integrantes sueltos son opcionales y sin repetir (RN-32)", () => {
		const proyecto = Proyecto.crear(10, { ...datos, integranteIds: [4, 4] });
		expect(proyecto.getIntegranteIds()).toEqual([4]);
	});
});
