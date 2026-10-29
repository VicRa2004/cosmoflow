/** Invitación vista por el administrador de la organización. */
export interface InvitacionDto {
	id: number;
	email: string;
	/** ISO 8601 */
	expiraEn: string;
	/** Pendiente pero ya caducada: hay que reenviarla. */
	isCaducada: boolean;
	/** ISO 8601 */
	createdAt: string;
}

/** Invitación vista por quien la recibe, antes de responder. */
export interface InvitacionRecibidaDto {
	nombreOrganizacion: string;
	email: string;
	/** Se puede aceptar o rechazar. */
	isVigente: boolean;
}
