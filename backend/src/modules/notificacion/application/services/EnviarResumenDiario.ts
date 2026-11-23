import type {
	NotificacionRepository,
	TareaDelDia,
} from "../../domain/repository/NotificacionRepository";
import { enZona, HORA_AVISO } from "./diaLocal";
import type { Notificador } from "./Notificador";

/** Títulos por grupo; el resto se resume en «y N más». */
const MAX_TITULOS = 5;

function linea(etiqueta: string, tareas: TareaDelDia[]): string | null {
	if (tareas.length === 0) return null;
	const titulos = tareas.slice(0, MAX_TITULOS).map((t) => `«${t.titulo}»`);
	const resto = tareas.length - titulos.length;
	return `${etiqueta} (${tareas.length}): ${titulos.join(", ")}${resto > 0 ? ` y ${resto} más` : ""}.`;
}

/** «2 vencen hoy»; `null` si no hay ninguna. */
function contar(
	tareas: TareaDelDia[],
	singular: string,
	plural: string,
): string | null {
	if (tareas.length === 0) return null;
	return `${tareas.length} ${tareas.length === 1 ? singular : plural}`;
}

/**
 * La llama el `Scheduler` cada hora: desde las 8:00 locales manda a quien lo activó
 * un resumen de lo atrasado, lo que vence hoy y lo que empieza hoy. La clave por
 * día evita repetirlo; si no hay nada, no avisa.
 */
export class EnviarResumenDiario {
	constructor(
		private readonly repo: NotificacionRepository,
		private readonly notificador: Notificador,
		private readonly appUrl: string,
		private readonly zona: string,
	) {}

	async ejecutar(ahora = new Date()): Promise<void> {
		const { dia: hoy, hora } = enZona(ahora, this.zona);
		if (hora < HORA_AVISO) return;

		for (const usuarioId of await this.repo.usuariosConResumenDiario()) {
			const tareas = await this.repo.tareasDelDia(usuarioId, hoy);
			const atrasadas = tareas.filter(
				(t) => t.fechaVencimiento !== null && t.fechaVencimiento < hoy,
			);
			const vencenHoy = tareas.filter((t) => t.fechaVencimiento === hoy);
			// Las que además vencen hoy o están atrasadas ya salen arriba.
			const empiezanHoy = tareas.filter(
				(t) =>
					t.fechaInicio === hoy &&
					(t.fechaVencimiento === null || t.fechaVencimiento > hoy),
			);
			const lineas = [
				linea("Vencen hoy", vencenHoy),
				linea("Atrasadas", atrasadas),
				linea("Empiezan hoy", empiezanHoy),
			].filter((l) => l !== null);
			if (lineas.length === 0) continue;

			const cuentas = [
				contar(vencenHoy, "vence hoy", "vencen hoy"),
				contar(atrasadas, "atrasada", "atrasadas"),
				contar(empiezanHoy, "empieza hoy", "empiezan hoy"),
			].filter((c) => c !== null);
			await this.notificador.notificar({
				evento: "resumenDiario",
				usuarioIds: [usuarioId],
				organizacionId: null,
				clave: `resumenDiario:${hoy}`,
				aviso: {
					asunto: `Tu día en Cosmoflow: ${cuentas.join(", ")}`,
					texto: lineas.join("\n"),
					enlace: `${this.appUrl}/dashboard`,
				},
			});
		}
	}
}
