import { InvitacionDuplicadaError } from "../../domain/error/InvitacionDuplicadaError";
import { YaEsMiembroError } from "../../domain/error/YaEsMiembroError";
import { Invitacion } from "../../domain/Invitacion";
import type { InvitacionRepository } from "../../domain/repository/InvitacionRepository";
import type { OrganizacionRepository } from "../../domain/repository/OrganizacionRepository";
import type { InvitacionDto } from "../dtos/InvitacionDto";
import { InvitacionMapper } from "../mappers/InvitacionMapper";
import type { EmisorInvitaciones } from "../services/EmisorInvitaciones";
import { buscarComoAdmin } from "./buscarComoAdmin";

/** Invita por correo a una organización (RN-12). Solo el administrador. */
export class InvitarUseCase {
	constructor(
		private readonly organizacionRepository: OrganizacionRepository,
		private readonly invitacionRepository: InvitacionRepository,
		private readonly emisor: EmisorInvitaciones,
	) {}

	async ejecutar(
		usuarioId: number,
		organizacionId: number,
		email: string,
	): Promise<InvitacionDto> {
		const organizacion = await buscarComoAdmin(
			this.organizacionRepository,
			usuarioId,
			organizacionId,
		);
		if (
			await this.organizacionRepository.esMiembroPorEmail(organizacionId, email)
		) {
			throw new YaEsMiembroError();
		}
		if (
			await this.invitacionRepository.buscarPendientePorEmail(
				organizacionId,
				email,
			)
		) {
			throw new InvitacionDuplicadaError();
		}

		const { token, tokenHash, expiraEn } = this.emisor.nuevoToken();
		const creada = await this.invitacionRepository.crear(
			Invitacion.crear({ organizacionId, email, tokenHash, expiraEn }),
		);
		await this.emisor.enviar(
			creada.getEmail(),
			organizacion.getNombre(),
			token,
		);
		return InvitacionMapper.toDto(creada);
	}
}
