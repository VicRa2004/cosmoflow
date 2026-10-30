import type { NotificacionRepository } from "../../domain/repository/NotificacionRepository";
import type { Notificador } from "./Notificador";

/** Antes de esta hora local no se avisa: nadie quiere el recordatorio de madrugada. */
const HORA_AVISO = 8;

/** Día `AAAA-MM-DD` y hora (0-23) de `ahora` en la zona dada. */
function enZona(ahora: Date, zona: string) {
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

const diaSiguiente = (dia: string) =>
	new Date(Date.parse(`${dia}T00:00:00Z`) + 86_400_000)
		.toISOString()
		.slice(0, 10);

/**
 * La llama el `Scheduler` cada hora: desde las 8:00 locales avisa de las tareas que
 * vencen mañana y de las que vencen hoy, a sus responsables o, si no tienen, a quien
 * la creó (el dueño, si es personal). La clave por tarea y día evita repetirlo.
 */
export class AvisarVencimientos {
	constructor(
		private readonly repo: NotificacionRepository,
		private readonly notificador: Notificador,
		private readonly appUrl: string,
		private readonly zona: string,
	) {}

	async ejecutar(ahora = new Date()): Promise<void> {
		const { dia: hoy, hora } = enZona(ahora, this.zona);
		if (hora < HORA_AVISO) return;
		const manana = diaSiguiente(hoy);

		for (const tarea of await this.repo.tareasPorVencer([hoy, manana])) {
			const cuando = tarea.fechaVencimiento === hoy ? "hoy" : "mañana";
			await this.notificador.notificar({
				evento: "vencimiento",
				usuarioIds:
					tarea.responsableIds.length > 0
						? tarea.responsableIds
						: [tarea.usuarioId],
				organizacionId: tarea.organizacionId,
				clave: `vencimiento:${tarea.id}:${tarea.fechaVencimiento}:${cuando}`,
				aviso: {
					asunto: `«${tarea.titulo}» vence ${cuando}`,
					texto: `La tarea «${tarea.titulo}» vence ${cuando} (${tarea.fechaVencimiento}).`,
					enlace: `${this.appUrl}/tareas/${tarea.id}`,
				},
			});
		}
	}
}
