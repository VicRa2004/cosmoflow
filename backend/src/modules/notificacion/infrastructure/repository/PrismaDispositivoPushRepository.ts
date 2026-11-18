import { prisma } from "@/core/config/prisma";
import type {
	DispositivoPushRepository,
	PlataformaPush,
} from "../../domain/repository/DispositivoPushRepository";

export class PrismaDispositivoPushRepository
	implements DispositivoPushRepository
{
	async registrar(
		usuarioId: number,
		token: string,
		plataforma: PlataformaPush,
	): Promise<void> {
		await prisma.dispositivoPush.upsert({
			where: { token },
			create: { usuarioId, token, plataforma },
			update: { usuarioId, plataforma },
		});
	}

	async eliminar(usuarioId: number, token: string): Promise<void> {
		await prisma.dispositivoPush.deleteMany({
			where: { usuarioId, token },
		});
	}

	async eliminarPorToken(token: string): Promise<void> {
		await prisma.dispositivoPush.deleteMany({
			where: { token },
		});
	}

	async contar(usuarioId: number): Promise<number> {
		return prisma.dispositivoPush.count({
			where: { usuarioId },
		});
	}
}
