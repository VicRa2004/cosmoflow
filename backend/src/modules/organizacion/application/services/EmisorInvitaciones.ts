import { createHash, randomBytes } from "node:crypto";
import type { Mailer } from "@/core/shared/domain/Mailer";

const VIGENCIA_MS = 7 * 24 * 60 * 60 * 1000;

/** El token se guarda hasheado: con la BD en la mano no se puede aceptar nada. */
export const hashearToken = (token: string) =>
	createHash("sha256").update(token).digest("hex");

/** Genera el token de un solo uso y envía el enlace; el token en claro solo viaja en el correo. */
export class EmisorInvitaciones {
	constructor(
		private readonly mailer: Mailer,
		private readonly appUrl: string,
	) {}

	nuevoToken() {
		const token = randomBytes(32).toString("hex");
		return {
			token,
			tokenHash: hashearToken(token),
			expiraEn: new Date(Date.now() + VIGENCIA_MS),
		};
	}

	async enviar(email: string, nombreOrganizacion: string, token: string) {
		await this.mailer.enviar({
			para: email,
			asunto: `Te han invitado a ${nombreOrganizacion} en Cosmoflow`,
			texto: `Hola:\n\nTe han invitado a unirte a «${nombreOrganizacion}» en Cosmoflow. Abre este enlace para aceptar o rechazar (caduca en 7 días):\n${this.appUrl}/invitacion?token=${token}\n\nSi no tienes cuenta, créala con este mismo email. Si no esperabas esta invitación, ignora este correo.`,
		});
	}
}
