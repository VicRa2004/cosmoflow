import type { TareaDto } from "../../application/dtos/TareaDto";

/** Texto de RFC 5545 §3.3.11: escapa `\`, `;`, `,` y saltos de línea. */
const escapar = (texto: string): string =>
	texto
		.replace(/\\/g, "\\\\")
		.replace(/;/g, ";")
		.replace(/,/g, "\\,")
		.replace(/\r?\n/g, "\\n");

/** Pliega a 75 octetos (RFC 5545 §3.1) sin partir caracteres UTF-8. */
function plegar(linea: string): string {
	const partes: string[] = [];
	let actual = "";
	let octetos = 0;
	for (const caracter of linea) {
		const tam = Buffer.byteLength(caracter);
		// Las continuaciones empiezan por un espacio, que también cuenta.
		if (octetos + tam > (partes.length ? 74 : 75)) {
			partes.push(actual);
			actual = "";
			octetos = 0;
		}
		actual += caracter;
		octetos += tam;
	}
	partes.push(actual);
	return partes.join("\r\n ");
}

const fechaIcs = (dia: string): string => dia.replaceAll("-", "");

function diaSiguiente(dia: string): string {
	const fecha = new Date(`${dia}T00:00:00Z`);
	fecha.setUTCDate(fecha.getUTCDate() + 1);
	return fecha.toISOString().slice(0, 10);
}

/**
 * Feed iCalendar con un evento de día completo por tarea, en su vencimiento o,
 * sin él, en su inicio (mismo criterio que el calendario de la web).
 */
export function generarIcs(
	tareas: TareaDto[],
	appUrl: string,
	ahora = new Date(),
): string {
	const dominio = new URL(appUrl).hostname;
	const sello = `${ahora.toISOString().replace(/[-:]/g, "").slice(0, 15)}Z`;
	const lineas = [
		"BEGIN:VCALENDAR",
		"VERSION:2.0",
		"PRODID:-//Cosmoflow//Tareas//ES",
		"CALSCALE:GREGORIAN",
		"METHOD:PUBLISH",
		"X-WR-CALNAME:Cosmoflow",
		"REFRESH-INTERVAL;VALUE=DURATION:PT1H",
		"X-PUBLISHED-TTL:PT1H",
	];
	for (const tarea of tareas) {
		const dia = tarea.fechaVencimiento ?? tarea.fechaInicio;
		if (!dia) continue;
		const enlace = `${appUrl}/tareas/${tarea.id}`;
		lineas.push(
			"BEGIN:VEVENT",
			`UID:tarea-${tarea.id}@${dominio}`,
			`DTSTAMP:${sello}`,
			`DTSTART;VALUE=DATE:${fechaIcs(dia)}`,
			`DTEND;VALUE=DATE:${fechaIcs(diaSiguiente(dia))}`,
			`SUMMARY:${escapar(tarea.titulo)}`,
			`DESCRIPTION:${escapar(`Prioridad ${tarea.prioridad} · ${tarea.estado.replace("_", " ")}\n${enlace}`)}`,
			`URL:${enlace}`,
			"TRANSP:TRANSPARENT",
			"END:VEVENT",
		);
	}
	lineas.push("END:VCALENDAR");
	return `${lineas.map(plegar).join("\r\n")}\r\n`;
}
