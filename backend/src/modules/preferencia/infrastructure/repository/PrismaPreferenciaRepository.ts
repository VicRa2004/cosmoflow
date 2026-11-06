import { prisma } from "@/core/config/prisma";
import type { PreferenciasInterfaz } from "../../domain/PreferenciasInterfaz";
import type { PreferenciaRepository } from "../../domain/repository/PreferenciaRepository";

export class PrismaPreferenciaRepository implements PreferenciaRepository {
	async obtener(usuarioId: number): Promise<Partial<PreferenciasInterfaz>> {
		const fila = await prisma.preferenciaInterfaz.findUnique({
			where: { usuarioId },
		});
		// Lo escribió `guardar` con datos ya validados por el schema HTTP.
		return (fila?.datos ?? {}) as Partial<PreferenciasInterfaz>;
	}

	async guardar(usuarioId: number, datos: PreferenciasInterfaz): Promise<void> {
		await prisma.preferenciaInterfaz.upsert({
			where: { usuarioId },
			create: { usuarioId, datos: { ...datos } },
			update: { datos: { ...datos } },
		});
	}
}
