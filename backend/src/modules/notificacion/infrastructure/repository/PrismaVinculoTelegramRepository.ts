import { prisma } from "@/core/config/prisma";
import type { VinculoTelegramRepository } from "../../domain/repository/VinculoTelegramRepository";

export class PrismaVinculoTelegramRepository
	implements VinculoTelegramRepository
{
	async estaVinculado(usuarioId: number): Promise<boolean> {
		const vinculo = await prisma.vinculoTelegram.findUnique({
			where: { usuarioId },
			select: { chatId: true },
		});
		return Boolean(vinculo?.chatId);
	}

	async guardarToken(
		usuarioId: number,
		tokenHash: string,
		expiraEn: Date,
	): Promise<void> {
		await prisma.vinculoTelegram.upsert({
			where: { usuarioId },
			create: { usuarioId, tokenHash, tokenExpiraEn: expiraEn },
			update: { tokenHash, tokenExpiraEn: expiraEn },
		});
	}

	async vincularPorToken(tokenHash: string, chatId: string): Promise<boolean> {
		return prisma.$transaction(async (tx) => {
			const vinculo = await tx.vinculoTelegram.findFirst({
				where: { tokenHash, tokenExpiraEn: { gt: new Date() } },
			});
			if (!vinculo) return false;
			// Un chat, una cuenta: si ya estaba en otra, deja de estarlo.
			await tx.vinculoTelegram.updateMany({
				where: { chatId, usuarioId: { not: vinculo.usuarioId } },
				data: { chatId: null, vinculadoEn: null },
			});
			await tx.vinculoTelegram.update({
				where: { usuarioId: vinculo.usuarioId },
				data: {
					chatId,
					vinculadoEn: new Date(),
					tokenHash: null,
					tokenExpiraEn: null,
				},
			});
			return true;
		});
	}

	async desvincular(usuarioId: number): Promise<void> {
		await prisma.vinculoTelegram.deleteMany({ where: { usuarioId } });
	}
}
