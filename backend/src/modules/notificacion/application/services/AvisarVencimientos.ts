import type { NotificacionRepository } from "../../domain/repository/NotificacionRepository";
import { diaSiguiente, enZona, HORA_AVISO } from "./diaLocal";
import type { Notificador } from "./Notificador";

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
					destino: { tipo: "tarea", id: tarea.id },
				},
			});
		}
	}
}
