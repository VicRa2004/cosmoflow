import type {
	BandejaNotificacionRepository,
	FiltrosBandeja,
	PaginaNotificaciones,
} from "../../domain/repository/BandejaNotificacionRepository";

export class ObtenerNotificacionesUseCase {
	constructor(private readonly bandeja: BandejaNotificacionRepository) {}

	async ejecutar(
		usuarioId: number,
		filtros: FiltrosBandeja,
	): Promise<PaginaNotificaciones> {
		return this.bandeja.buscar(usuarioId, filtros);
	}
}
