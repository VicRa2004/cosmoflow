import type { DispositivoPushRepository } from "../../domain/repository/DispositivoPushRepository";

/** Da de baja el token push de un dispositivo del usuario (p. ej. al cerrar sesión). */
export class EliminarDispositivoPushUseCase {
	constructor(private readonly dispositivos: DispositivoPushRepository) {}

	async ejecutar(usuarioId: number, token: string): Promise<void> {
		await this.dispositivos.eliminar(usuarioId, token);
	}
}
