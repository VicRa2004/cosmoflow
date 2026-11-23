import { describe, expect, it } from "vitest";
import { diasAtajo } from "./CamposPropiedades";

describe("diasAtajo", () => {
	it.each([
		// [hoy, mañana, próximo lunes]
		[new Date(2026, 10, 23), "2026-11-23", "2026-11-24", "2026-11-30"], // lunes
		[new Date(2026, 10, 29), "2026-11-29", "2026-11-30", "2026-11-30"], // domingo
		[new Date(2026, 11, 31), "2026-12-31", "2027-01-01", "2027-01-04"], // jueves, cambio de año
	])("%s", (hoy, dia, manana, lunes) => {
		expect(diasAtajo(hoy)).toEqual({
			Hoy: dia,
			Mañana: manana,
			"Próx. semana": lunes,
		});
	});
});
