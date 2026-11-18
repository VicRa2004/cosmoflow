import type { ClientePush } from "../../domain/ClientePush";
import type { DispositivoPushRepository } from "../../domain/repository/DispositivoPushRepository";

export interface EstadoMovilDto {
	disponible: boolean;
	dispositivos: number;
}

/** Indica si el servidor tiene FCM configurado y cuántos dispositivos registró el usuario. */
export class ObtenerEstadoMovilUseCase {
	constructor(
		private readonly dispositivos: DispositivoPushRepository,
		private readonly clientePush: ClientePush | null,
	) {}

	async ejecutar(usuarioId: number): Promise<EstadoMovilDto> {
		if (!this.clientePush) {
			return { disponible: false, dispositivos: 0 };
		}
		return {
			disponible: true,
			dispositivos: await this.dispositivos.contar(usuarioId),
		};
	}
}
