import { describe, expect, it } from "bun:test";
import { Equipo } from "./Equipo";
import { EquipoInvalidoError } from "./error/EquipoInvalidoError";

const datos = {
	nombre: "Plataforma",
	descripcion: "",
	color: "#6366f1",
	liderId: null,
	miembroIds: [1, 2, 3],
	tagIds: [],
};

describe("Equipo", () => {
	it("necesita al menos 2 miembros distintos (RN-20)", () => {
		expect(() => Equipo.crear(10, { ...datos, miembroIds: [1, 1] })).toThrow(
			EquipoInvalidoError,
		);
	});

	it("no deja quitar al penúltimo (RN-26)", () => {
		const equipo = Equipo.crear(10, { ...datos, miembroIds: [1, 2] });
		expect(() => equipo.actualizar({ miembroIds: [1] })).toThrow(
			"al menos 2 miembros",
		);
	});

	it("el líder tiene que ser miembro, también tras quitarlo del equipo", () => {
		expect(() => Equipo.crear(10, { ...datos, liderId: 9 })).toThrow(
			"El líder debe ser miembro",
		);
		const equipo = Equipo.crear(10, { ...datos, liderId: 3 });
		expect(() => equipo.actualizar({ miembroIds: [1, 2] })).toThrow(
			"El líder debe ser miembro",
		);
		equipo.actualizar({ miembroIds: [1, 2], liderId: null });
		expect(equipo.getLiderId()).toBeNull();
	});

	it("sin líder crea tareas cualquier miembro; con líder, él y sus delegados (RN-22)", () => {
		const equipo = Equipo.crear(10, datos);
		expect(equipo.puedeCrearTareas(2)).toBe(true);
		expect(equipo.puedeCrearTareas(99)).toBe(false);

		equipo.actualizar({ liderId: 1 });
		equipo.cambiarDelegados([2]);
		expect(equipo.puedeCrearTareas(1)).toBe(true);
		expect(equipo.puedeCrearTareas(2)).toBe(true);
		expect(equipo.puedeCrearTareas(3)).toBe(false);
	});

	it("los delegados son miembros y lo siguen siendo al editar el equipo", () => {
		const equipo = Equipo.crear(10, { ...datos, liderId: 1 });
		expect(() => equipo.cambiarDelegados([9])).toThrow(EquipoInvalidoError);
		equipo.cambiarDelegados([2]);
		equipo.actualizar({ miembroIds: [1, 2, 4] });
		expect(equipo.getMiembros()).toEqual([
			{ usuarioId: 1, puedeCrearTareas: false },
			{ usuarioId: 2, puedeCrearTareas: true },
			{ usuarioId: 4, puedeCrearTareas: false },
		]);
	});
});
