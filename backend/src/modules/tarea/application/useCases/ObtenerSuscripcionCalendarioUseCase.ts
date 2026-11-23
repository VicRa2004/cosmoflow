import type { SuscripcionCalendarioRepository } from "../../domain/repository/SuscripcionCalendarioRepository";

export class ObtenerSuscripcionCalendarioUseCase {
	constructor(private readonly repo: SuscripcionCalendarioRepository) {}

	async ejecutar(
		usuarioId: number,
	): Promise<{ activa: boolean; creadaEn: string | null }> {
		const creadaEn = await this.repo.creadaEn(usuarioId);
		return {
			activa: creadaEn !== null,
			creadaEn: creadaEn?.toISOString() ?? null,
		};
	}
}
