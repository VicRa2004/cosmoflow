import type { Transporter } from "nodemailer";
import type { Correo, Mailer } from "@/core/shared/domain/Mailer";

/** Envío real por SMTP con Nodemailer. */
export class SmtpMailer implements Mailer {
	constructor(
		private readonly transporte: Pick<Transporter, "sendMail">,
		private readonly remitente: string,
	) {}

	async enviar({ para, asunto, texto }: Correo): Promise<void> {
		await this.transporte.sendMail({
			from: this.remitente,
			to: para,
			subject: asunto,
			text: texto,
		});
	}
}
