import { Entity } from "@/core/shared/domain/Entity";
import { EntityId } from "@/core/shared/domain/EntityId";

export type EstadoInvitacion =
	| "pendiente"
	| "aceptada"
	| "rechazada"
	| "cancelada";

interface DatosInvitacion {
	organizacionId: number;
	/** En minúsculas. */
	email: string;
	tokenHash: string;
	estado: EstadoInvitacion;
	expiraEn: Date;
	createdAt: Date;
}

/** Única vía para entrar en una organización (RN-12). Un solo uso y con caducidad. */
export class Invitacion extends Entity {
	private datos: DatosInvitacion;

	private constructor(id: EntityId, datos: DatosInvitacion) {
		super(id);
		this.datos = datos;
	}

	public static crear(datos: {
		organizacionId: number;
		email: string;
		tokenHash: string;
		expiraEn: Date;
	}): Invitacion {
		return new Invitacion(new EntityId(), {
			...datos,
			email: datos.email.toLowerCase(),
			estado: "pendiente",
			createdAt: new Date(),
		});
	}

	public static reconstituir(id: number, datos: DatosInvitacion): Invitacion {
		return new Invitacion(new EntityId(id), datos);
	}

	getOrganizacionId() {
		return this.datos.organizacionId;
	}

	getEmail() {
		return this.datos.email;
	}

	getTokenHash() {
		return this.datos.tokenHash;
	}

	getEstado() {
		return this.datos.estado;
	}

	getExpiraEn() {
		return this.datos.expiraEn;
	}

	getCreatedAt() {
		return this.datos.createdAt;
	}

	isPendiente() {
		return this.datos.estado === "pendiente";
	}

	/** Pendiente y sin caducar: se puede aceptar o rechazar. */
	isVigente(ahora = new Date()) {
		return this.isPendiente() && this.datos.expiraEn > ahora;
	}

	isPara(email: string) {
		return this.datos.email === email.toLowerCase();
	}

	/** Reenviar: el enlace anterior deja de valer. */
	public renovar(tokenHash: string, expiraEn: Date): void {
		this.datos.tokenHash = tokenHash;
		this.datos.expiraEn = expiraEn;
	}

	public responder(estado: "aceptada" | "rechazada" | "cancelada"): void {
		this.datos.estado = estado;
	}
}
