import type { SuscripcionCalendarioRepository } from "../../domain/repository/SuscripcionCalendarioRepository";

export class RevocarSuscripcionCalendarioUseCase {
	constructor(private readonly repo: SuscripcionCalendarioRepository) {}

	async ejecutar(usuarioId: number): Promise<void> {
		await this.repo.eliminar(usuarioId);
	}
}
