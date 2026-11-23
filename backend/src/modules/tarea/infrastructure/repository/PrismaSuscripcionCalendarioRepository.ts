import { prisma } from "@/core/config/prisma";
import type { SuscripcionCalendarioRepository } from "../../domain/repository/SuscripcionCalendarioRepository";

export class PrismaSuscripcionCalendarioRepository
	implements SuscripcionCalendarioRepository
{
	async guardar(usuarioId: number, tokenHash: string): Promise<void> {
		await prisma.suscripcionCalendario.upsert({
			where: { usuarioId },
			create: { usuarioId, tokenHash },
			update: { tokenHash, createdAt: new Date() },
		});
	}

	async eliminar(usuarioId: number): Promise<void> {
		await prisma.suscripcionCalendario.deleteMany({ where: { usuarioId } });
	}

	async creadaEn(usuarioId: number): Promise<Date | null> {
		const fila = await prisma.suscripcionCalendario.findUnique({
			where: { usuarioId },
			select: { createdAt: true },
		});
		return fila?.createdAt ?? null;
	}

	async buscarUsuarioPorHash(tokenHash: string): Promise<number | null> {
		const fila = await prisma.suscripcionCalendario.findFirst({
			where: { tokenHash, usuario: { deletedAt: null } },
			select: { usuarioId: true },
		});
		return fila?.usuarioId ?? null;
	}
}
