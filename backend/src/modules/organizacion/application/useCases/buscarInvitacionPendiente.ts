import { InvitacionNoEncontradaError } from "../../domain/error/InvitacionNoEncontradaError";
import { InvitacionNoVigenteError } from "../../domain/error/InvitacionNoVigenteError";
import type { InvitacionRepository } from "../../domain/repository/InvitacionRepository";
import type { OrganizacionRepository } from "../../domain/repository/OrganizacionRepository";
import { buscarComoAdmin } from "./buscarComoAdmin";

/** Para reenviar o cancelar: como admin y con la invitación aún pendiente. */
export async function buscarInvitacionPendiente(
	repos: {
		organizaciones: OrganizacionRepository;
		invitaciones: InvitacionRepository;
	},
	usuarioId: number,
	organizacionId: number,
	id: number,
) {
	const organizacion = await buscarComoAdmin(
		repos.organizaciones,
		usuarioId,
		organizacionId,
	);
	const invitacion = await repos.invitaciones.buscarPorId(organizacionId, id);
	if (!invitacion) throw new InvitacionNoEncontradaError();
	if (!invitacion.isPendiente()) throw new InvitacionNoVigenteError();
	return { organizacion, invitacion };
}
