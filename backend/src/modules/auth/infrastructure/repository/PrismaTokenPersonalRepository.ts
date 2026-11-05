import { prisma } from "@/core/config/prisma";
import type {
	TokenPersonal,
	TokenPersonalRepository,
} from "../../domain/repository/TokenPersonalRepository";

const campos = { id: true, nombre: true, pista: true, createdAt: true };

export class PrismaTokenPersonalRepository implements TokenPersonalRepository {
	crear(data: {
		nombre: string;
		tokenHash: string;
		pista: string;
		usuarioId: number;
	}): Promise<TokenPersonal> {
		return prisma.tokenPersonal.create({ data, select: campos });
	}

	listar(usuarioId: number): Promise<TokenPersonal[]> {
		return prisma.tokenPersonal.findMany({
			where: { usuarioId, revocadoEn: null },
			select: campos,
			orderBy: { id: "desc" },
		});
	}

	async buscarUsuarioIdPorHash(tokenHash: string): Promise<number | null> {
		const registro = await prisma.tokenPersonal.findUnique({
			where: { tokenHash, revocadoEn: null },
			select: { usuarioId: true },
		});
		return registro?.usuarioId ?? null;
	}

	async revocar(id: number, usuarioId: number): Promise<boolean> {
		const { count } = await prisma.tokenPersonal.updateMany({
			where: { id, usuarioId, revocadoEn: null },
			data: { revocadoEn: new Date() },
		});
		return count === 1;
	}
}
