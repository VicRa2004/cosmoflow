import { describe, expect, it } from "bun:test";
import { ProyectoInvalidoError } from "./error/ProyectoInvalidoError";
import { Proyecto } from "./Proyecto";

const datos = {
	nombre: "Lanzamiento",
	descripcion: "",
	estado: "activo" as const,
	color: null,
	fechaInicio: null,
	fechaFin: null,
	equipoIds: [1],
	integranteIds: [],
};

describe("Proyecto", () => {
	it("el color se conserva si no llega y se quita con null", () => {
		const proyecto = Proyecto.crear(10, { ...datos, color: "#f59e0b" });
		proyecto.actualizar({ nombre: "Otro" });
		expect(proyecto.getColor()).toBe("#f59e0b");
		proyecto.actualizar({ color: null });
		expect(proyecto.getColor()).toBeNull();
	});

	it("la fecha de inicio no puede ser posterior a la de fin", () => {
		const proyecto = Proyecto.crear(10, {
			...datos,
			fechaInicio: "2026-11-01",
			fechaFin: "2026-11-30",
		});
		expect(() => proyecto.actualizar({ fechaFin: "2026-10-31" })).toThrow(
			ProyectoInvalidoError,
		);
		proyecto.actualizar({ fechaInicio: null, fechaFin: "2026-10-31" });
		expect(proyecto.getFechaInicio()).toBeNull();
		expect(proyecto.getFechaFin()).toBe("2026-10-31");
	});

	it("no se crea sin equipos ni integrantes (RN-31)", () => {
		expect(() => Proyecto.crear(10, { ...datos, equipoIds: [] })).toThrow(
			ProyectoInvalidoError,
		);
	});

	it("se crea solo con un integrante suelto (RN-31)", () => {
		const proyecto = Proyecto.crear(10, {
			...datos,
			equipoIds: [],
			integranteIds: [4],
		});
		expect(proyecto.getEquipoIds()).toEqual([]);
	});

	it("no se queda sin integrantes al editar", () => {
		const proyecto = Proyecto.crear(10, datos);
		expect(() => proyecto.actualizar({ equipoIds: [] })).toThrow(
			"al menos un integrante",
		);
		proyecto.actualizar({ equipoIds: [], integranteIds: [4] });
		expect(proyecto.getEquipoIds()).toEqual([]);
		proyecto.actualizar({ equipoIds: [2, 2, 3], estado: "en_pausa" });
		expect(proyecto.getEquipoIds()).toEqual([2, 3]);
		expect(proyecto.getEstado()).toBe("en_pausa");
	});

	it("los integrantes sueltos son opcionales y sin repetir (RN-32)", () => {
		const proyecto = Proyecto.crear(10, { ...datos, integranteIds: [4, 4] });
		expect(proyecto.getIntegranteIds()).toEqual([4]);
	});
});
