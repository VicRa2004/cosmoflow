import { prisma } from "@/core/config/prisma";
import type { Adjunto } from "../../domain/Adjunto";
import type { AdjuntoRepository } from "../../domain/repository/AdjuntoRepository";

export class PrismaAdjuntoRepository implements AdjuntoRepository {
	crear(datos: Omit<Adjunto, "id">): Promise<Adjunto> {
		return prisma.adjunto.create({ data: datos });
	}

	buscarPorId(usuarioId: number, id: number): Promise<Adjunto | null> {
		return prisma.adjunto.findFirst({ where: { id, usuarioId } });
	}
}
