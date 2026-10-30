import type { VinculoTelegramRepository } from "../../domain/repository/VinculoTelegramRepository";

export class DesvincularTelegramUseCase {
	constructor(private readonly repo: VinculoTelegramRepository) {}

	async ejecutar(usuarioId: number): Promise<void> {
		await this.repo.desvincular(usuarioId);
	}
}
