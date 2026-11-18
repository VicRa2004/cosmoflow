import type {
	DispositivoPushRepository,
	PlataformaPush,
} from "../../domain/repository/DispositivoPushRepository";

export interface RegistrarDispositivoPushDto {
	token: string;
	plataforma: PlataformaPush;
}

/** Registra o actualiza el token push de un dispositivo móvil del usuario. */
export class RegistrarDispositivoPushUseCase {
	constructor(private readonly dispositivos: DispositivoPushRepository) {}

	async ejecutar(
		usuarioId: number,
		dto: RegistrarDispositivoPushDto,
	): Promise<void> {
		await this.dispositivos.registrar(usuarioId, dto.token, dto.plataforma);
	}
}
