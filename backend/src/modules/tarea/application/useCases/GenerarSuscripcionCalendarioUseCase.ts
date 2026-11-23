import type { SuscripcionCalendarioRepository } from "../../domain/repository/SuscripcionCalendarioRepository";
import { hashTokenCalendario, nuevoTokenCalendario } from "./tokenCalendario";

/**
 * Crea (o regenera) la URL del feed iCalendar. Solo se ve al generarla: se guarda
 * el hash, igual que los tokens personales.
 */
export class GenerarSuscripcionCalendarioUseCase {
	constructor(
		private readonly repo: SuscripcionCalendarioRepository,
		private readonly appUrl: string,
	) {}

	async ejecutar(usuarioId: number): Promise<{ url: string }> {
		const token = nuevoTokenCalendario();
		await this.repo.guardar(usuarioId, hashTokenCalendario(token));
		return { url: `${this.appUrl}/api/calendario/tareas.ics?token=${token}` };
	}
}
