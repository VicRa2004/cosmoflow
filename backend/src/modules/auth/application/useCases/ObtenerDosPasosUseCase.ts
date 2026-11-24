import type { DosPasosRepository } from "../../domain/repository/DosPasosRepository";

export class ObtenerDosPasosUseCase {
	constructor(private readonly dosPasosRepo: DosPasosRepository) {}

	async ejecutar(
		usuarioId: number,
	): Promise<{ isActivo: boolean; codigosRestantes: number }> {
		const dosPasos = await this.dosPasosRepo.obtener(usuarioId);
		return {
			isActivo: dosPasos?.isActivo ?? false,
			codigosRestantes: dosPasos?.isActivo ? dosPasos.codigosRestantes : 0,
		};
	}
}
