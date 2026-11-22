import { describe, expect, it } from "vitest";
import { textoListaRecortada } from "./AvisoListaRecortada";

describe("textoListaRecortada", () => {
	it("con total, avisa solo si supera el tope", () => {
		const texto = (total?: number) =>
			textoListaRecortada({ limite: 100, total, nombre: "tags" });
		expect(texto(100)).toBeNull();
		expect(texto(130)).toBe("Mostrando los primeros 100 de 130 tags.");
		expect(texto(undefined)).toBeNull();
	});

	it("sin total, avisa al llegar al tope porque puede haber más", () => {
		const texto = (cargados: number) =>
			textoListaRecortada({
				limite: 500,
				cargados,
				nombre: "tareas",
				femenino: true,
			});
		expect(texto(499)).toBeNull();
		expect(texto(500)).toBe(
			"Mostrando las primeras 500 tareas; puede haber más.",
		);
	});
});
