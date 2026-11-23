/** Antes de esta hora local no se avisa: nadie quiere el recordatorio de madrugada. */
export const HORA_AVISO = 8;

/** Día `AAAA-MM-DD` y hora (0-23) de `ahora` en la zona dada. */
export function enZona(ahora: Date, zona: string) {
	const partes = Object.fromEntries(
		new Intl.DateTimeFormat("en-CA", {
			timeZone: zona,
			year: "numeric",
			month: "2-digit",
			day: "2-digit",
			hour: "2-digit",
			hourCycle: "h23",
		})
			.formatToParts(ahora)
			.map((p) => [p.type, p.value]),
	);
	return {
		dia: `${partes.year}-${partes.month}-${partes.day}`,
		hora: Number(partes.hour),
	};
}

export const diaSiguiente = (dia: string) =>
	new Date(Date.parse(`${dia}T00:00:00Z`) + 86_400_000)
		.toISOString()
		.slice(0, 10);
