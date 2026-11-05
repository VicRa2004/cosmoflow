import { env } from "@/core/config/env";
import { S3Client } from "bun";
import { createTransport } from "nodemailer";
import { modules } from "@/modules";
import { LocalAlmacenamiento } from "../almacenamiento/LocalAlmacenamiento";
import { S3Almacenamiento } from "../almacenamiento/S3Almacenamiento";
import { NoopEventBus } from "../events/NoopEventBus";
import { PermitirAutenticadoGuard } from "../http/permisoGuard";
import { ConsoleMailer } from "../mail/ConsoleMailer";
import { ResendMailer } from "../mail/ResendMailer";
import { SmtpMailer } from "../mail/SmtpMailer";
import { PrismaUnitOfWork } from "../persistencia/PrismaUnitOfWork";
import { IntervalScheduler } from "../tareas/IntervalScheduler";
import { DependencyContainer } from "./DependencyContainer";
import { TOKENS } from "./tokens";

const container = new DependencyContainer();

// Infraestructura compartida; los módulos se registran después y pueden sobrescribirla.
container.set(TOKENS.EventBus, () => new NoopEventBus());
container.set(TOKENS.PermisoGuard, () => new PermitirAutenticadoGuard());
container.set(TOKENS.Mailer, () => {
	if (env.SMTP_HOST) {
		return new SmtpMailer(
			createTransport({
				host: env.SMTP_HOST,
				port: env.SMTP_PORT,
				secure: env.SMTP_SECURE,
				auth: env.SMTP_USER
					? { user: env.SMTP_USER, pass: env.SMTP_PASS }
					: undefined,
			}),
			env.MAIL_FROM,
		);
	}
	return env.RESEND_API_KEY
		? new ResendMailer(env.RESEND_API_KEY, env.MAIL_FROM)
		: new ConsoleMailer(env.NODE_ENV === "prod");
});
container.set(TOKENS.Scheduler, () => new IntervalScheduler());
container.set(TOKENS.UnitOfWork, () => new PrismaUnitOfWork());
container.set(TOKENS.Almacenamiento, () =>
	env.S3_BUCKET
		? new S3Almacenamiento(
				new S3Client({
					bucket: env.S3_BUCKET,
					endpoint: env.S3_ENDPOINT,
					region: env.S3_REGION,
					accessKeyId: env.S3_ACCESS_KEY_ID,
					secretAccessKey: env.S3_SECRET_ACCESS_KEY,
				}),
			)
		: new LocalAlmacenamiento(env.STORAGE_DIR),
);

for (const module of modules) module.register?.(container);

export { container };
