import { InvitacionDeOtroEmailError } from "../../domain/error/InvitacionDeOtroEmailError";
import { InvitacionNoEncontradaError } from "../../domain/error/InvitacionNoEncontradaError";
import type { InvitacionRepository } from "../../domain/repository/InvitacionRepository";
import { hashearToken } from "../services/EmisorInvitaciones";

/** Por el token del enlace; solo la ve la cuenta con el email invitado. */
export async function buscarInvitacionRecibida(
	repo: InvitacionRepository,
	email: string,
	token: string,
) {
	const encontrada = await repo.buscarPorTokenHash(hashearToken(token));
	if (!encontrada) throw new InvitacionNoEncontradaError();
	if (!encontrada.invitacion.isPara(email)) {
		throw new InvitacionDeOtroEmailError();
	}
	return encontrada;
}
