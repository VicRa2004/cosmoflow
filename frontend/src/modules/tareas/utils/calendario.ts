/** AAAA-MM-DD en hora local. */
export const diaLocal = (fecha: Date) => fecha.toLocaleDateString("sv-SE");

/**
 * Los días (AAAA-MM-DD) de la cuadrícula de un mes: semanas completas de lunes
 * a domingo que lo cubren. `mes` va de 0 a 11, como en `Date`.
 */
export function diasDelMes(anio: number, mes: number): string[] {
	// getDay(): 0 = domingo; con lunes primero, el domingo retrocede 6 días.
	const antes = (new Date(anio, mes, 1).getDay() + 6) % 7;
	const diasMes = new Date(anio, mes + 1, 0).getDate();
	const total = Math.ceil((antes + diasMes) / 7) * 7;
	return Array.from({ length: total }, (_, i) =>
		diaLocal(new Date(anio, mes, 1 - antes + i)),
	);
}
