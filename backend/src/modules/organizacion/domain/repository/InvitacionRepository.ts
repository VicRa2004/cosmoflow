import type { Invitacion } from "../Invitacion";

export interface InvitacionRepository {
	/** Pendientes (caducadas incluidas) de la organización, las más nuevas primero. */
	buscarPendientes: (organizacionId: number) => Promise<Invitacion[]>;
	buscarPorId: (
		organizacionId: number,
		id: number,
	) => Promise<Invitacion | null>;
	buscarPendientePorEmail: (
		organizacionId: number,
		email: string,
	) => Promise<Invitacion | null>;
	/** Ignora las de organizaciones borradas. */
	buscarPorTokenHash: (
		tokenHash: string,
	) => Promise<{ invitacion: Invitacion; nombreOrganizacion: string } | null>;
	crear: (data: Invitacion) => Promise<Invitacion>;
	actualizar: (data: Invitacion) => Promise<Invitacion>;
}
