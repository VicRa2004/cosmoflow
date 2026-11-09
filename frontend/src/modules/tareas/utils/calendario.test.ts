import { describe, expect, it } from "vitest";
import { diasDelMes } from "./calendario";

describe("diasDelMes", () => {
	it("noviembre de 2026 empieza en domingo: seis semanas desde el lunes 26 de octubre", () => {
		const dias = diasDelMes(2026, 10);
		expect(dias).toHaveLength(42);
		expect(dias[0]).toBe("2026-10-26");
		expect(dias.at(-1)).toBe("2026-12-06");
	});

	it("febrero de 2027 empieza en lunes y cabe en cuatro semanas", () => {
		const dias = diasDelMes(2027, 1);
		expect(dias).toHaveLength(28);
		expect(dias[0]).toBe("2027-02-01");
		expect(dias.at(-1)).toBe("2027-02-28");
	});
});
