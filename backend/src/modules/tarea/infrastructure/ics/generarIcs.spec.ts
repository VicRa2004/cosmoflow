import { describe, expect, it } from "bun:test";
import type { TareaDto } from "../../application/dtos/TareaDto";
import { generarIcs } from "./generarIcs";

const tarea = (datos: Partial<TareaDto>): TareaDto =>
	({
		id: 7,
		titulo: "Tarea",
		estado: "pendiente",
		prioridad: "media",
		fechaInicio: null,
		fechaVencimiento: null,
		...datos,
	}) as TareaDto;

const ahora = new Date("2026-11-23T10:20:30.000Z");

describe("generarIcs", () => {
	it("crea un evento de día completo en el vencimiento", () => {
		const ics = generarIcs(
			[tarea({ fechaInicio: "2026-11-20", fechaVencimiento: "2026-11-30" })],
			"https://app.ejemplo.com",
			ahora,
		);
		expect(ics).toContain("UID:tarea-7@app.ejemplo.com\r\n");
		expect(ics).toContain("DTSTAMP:20261123T102030Z\r\n");
		expect(ics).toContain("DTSTART;VALUE=DATE:20261130\r\n");
		// DTEND es exclusivo y cruza de mes
		expect(ics).toContain("DTEND;VALUE=DATE:20261201\r\n");
		expect(ics).toContain("URL:https://app.ejemplo.com/tareas/7\r\n");
		expect(ics.startsWith("BEGIN:VCALENDAR\r\n")).toBe(true);
		expect(ics.endsWith("END:VCALENDAR\r\n")).toBe(true);
	});

	it("usa el inicio si no hay vencimiento y omite las tareas sin fecha", () => {
		const ics = generarIcs(
			[tarea({ fechaInicio: "2026-12-31" }), tarea({ id: 8 })],
			"https://a.com",
			ahora,
		);
		expect(ics).toContain("DTSTART;VALUE=DATE:20261231\r\n");
		expect(ics).toContain("DTEND;VALUE=DATE:20270101\r\n");
		expect(ics).not.toContain("tarea-8@");
	});

	it("escapa el texto y pliega las líneas largas sin pasar de 75 octetos", () => {
		const titulo = `Revisar; coma, barra\\ y salto\n${"ñ".repeat(80)}`;
		const ics = generarIcs(
			[tarea({ titulo, fechaVencimiento: "2026-11-23" })],
			"https://a.com",
			ahora,
		);
		for (const linea of ics.split("\r\n")) {
			expect(Buffer.byteLength(linea)).toBeLessThanOrEqual(75);
		}
		const desplegado = ics.replace(/\r\n /g, "");
		expect(desplegado).toContain(
			`SUMMARY:Revisar; coma\\, barra\\\\ y salto\\n${"ñ".repeat(80)}\r\n`,
		);
	});
});
