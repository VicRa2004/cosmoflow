import { prisma } from "@/core/config/prisma";
import type { Adjunto, AmbitoAdjunto } from "../../domain/Adjunto";
import type { AdjuntoRepository } from "../../domain/repository/AdjuntoRepository";

export class PrismaAdjuntoRepository implements AdjuntoRepository {
	crear(datos: Omit<Adjunto, "id">): Promise<Adjunto> {
		return prisma.adjunto.create({ data: datos });
	}

	buscarPorId(id: number): Promise<Adjunto | null> {
		return prisma.adjunto.findUnique({ where: { id } });
	}

	async compartir(
		usuarioId: number,
		adjuntoIds: number[],
		ambito: AmbitoAdjunto,
	): Promise<void> {
		if (adjuntoIds.length === 0) return;
		await prisma.adjunto.updateMany({
			where: {
				id: { in: adjuntoIds },
				usuarioId,
				organizacionId: null,
				equipoId: null,
				proyectoId: null,
			},
			data: ambito,
		});
	}
}
