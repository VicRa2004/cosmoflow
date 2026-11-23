import type { Mailer } from "@/core/shared/domain/Mailer";
import { construirCorreoHtml } from "@/core/shared/domain/plantillaCorreo";
import type {
	Aviso,
	CanalNotificacion,
	Destinatario,
} from "../../domain/CanalNotificacion";

export class CorreoCanal implements CanalNotificacion {
	readonly canal = "correo";

	constructor(private readonly mailer: Mailer) {}

	enviar(destinatario: Destinatario, aviso: Aviso): Promise<void> {
		return this.mailer.enviar({
			para: destinatario.email,
			asunto: aviso.asunto,
			texto: `Hola, ${destinatario.nombre}:\n\n${aviso.texto}\n${aviso.enlace}\n\nPuedes elegir qué avisos recibir desde tu perfil.`,
			html: construirCorreoHtml({
				categoria: "Aviso",
				titulo: aviso.asunto,
				saludo: `Hola, ${destinatario.nombre}:`,
				// Un párrafo por línea: el HTML no respeta los saltos (p. ej. el resumen diario).
				parrafos: aviso.texto.split("\n").filter((p) => p.trim() !== ""),
				accion: {
					texto: "Abrir en Cosmoflow",
					url: aviso.enlace,
				},
				nota: "Puedes elegir qué avisos recibir por correo desde tu perfil.",
			}),
		});
	}
}
