import { SuscripcionCalendarioNoEncontradaError } from "../../domain/error/SuscripcionCalendarioNoEncontradaError";
import type { SuscripcionCalendarioRepository } from "../../domain/repository/SuscripcionCalendarioRepository";
import type { TareaRepository } from "../../domain/repository/TareaRepository";
import type { TareaDto } from "../dtos/TareaDto";
import { TareaMapper } from "../mappers/TareaMapper";
import { hashTokenCalendario } from "./tokenCalendario";

// shortcut: tope de 500 pendientes en el feed, paginar si alguien llega a tener más
const LIMITE = 500;

/** Pendientes del dueño del token (mismo criterio que la vista Pendientes). */
export class ObtenerFeedCalendarioUseCase {
	constructor(
		private readonly suscripciones: SuscripcionCalendarioRepository,
		private readonly tareaRepository: TareaRepository,
	) {}

	async ejecutar(token: string): Promise<TareaDto[]> {
		const usuarioId = await this.suscripciones.buscarUsuarioPorHash(
			hashTokenCalendario(token),
		);
		if (usuarioId === null) throw new SuscripcionCalendarioNoEncontradaError();
		const { datos } = await this.tareaRepository.buscarPendientes(usuarioId, {
			pagina: 1,
			limite: LIMITE,
		});
		return datos.map(TareaMapper.toDto);
	}
}
