import { describe, expect, it } from "bun:test";
import { resolverPreferencias } from "./catalogo";

const activo = (
	evento: string,
	canal: string,
	...capas: Parameters<typeof resolverPreferencias>
) =>
	resolverPreferencias(...capas).find(
		(p) => p.evento === evento && p.canal === canal,
	)?.activo;

describe("resolverPreferencias", () => {
	it("el resumen diario no llega por ningún canal hasta activarlo", () => {
		for (const canal of ["app", "correo", "telegram", "movil"]) {
			expect(activo("resumenDiario", canal)).toBe(false);
		}
		expect(
			activo("resumenDiario", "correo", [
				{ evento: "resumenDiario", canal: "correo", activo: true },
			]),
		).toBe(true);
	});

	it("los demás eventos siguen avisando por la app y el correo por defecto", () => {
		expect(activo("vencimiento", "correo")).toBe(true);
		expect(activo("vencimiento", "movil")).toBe(false);
	});
});
