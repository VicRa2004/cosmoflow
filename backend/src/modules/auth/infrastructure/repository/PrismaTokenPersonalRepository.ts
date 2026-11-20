import { prisma } from "@/core/config/prisma";
import type {
	CredencialesConexion,
	TokenPersonal,
	TokenPersonalRepository,
} from "../../domain/repository/TokenPersonalRepository";

const campos = {
	id: true,
	nombre: true,
	pista: true,
	createdAt: true,
	ultimoUsoEn: true,
};

export class PrismaTokenPersonalRepository implements TokenPersonalRepository {
	crear(data: {
		nombre: string;
		tokenHash: string;
		pista: string;
		usuarioId: number;
	}): Promise<TokenPersonal> {
		return prisma.tokenPersonal.create({ data, select: campos });
	}

	async crearConexion(
		data: CredencialesConexion & {
			nombre: string;
			usuarioId: number;
			clientId: string;
		},
	): Promise<void> {
		await prisma.tokenPersonal.create({
			data: { ...data, ultimoUsoEn: new Date() },
		});
	}

	listar(usuarioId: number): Promise<TokenPersonal[]> {
		return prisma.tokenPersonal.findMany({
			where: { usuarioId, revocadoEn: null },
			select: campos,
			orderBy: { id: "desc" },
		});
	}

	buscarPorHash(tokenHash: string): Promise<{
		id: number;
		usuarioId: number;
		ultimoUsoEn: Date | null;
	} | null> {
		return prisma.tokenPersonal.findUnique({
			where: {
				tokenHash,
				revocadoEn: null,
				OR: [{ expiraEn: null }, { expiraEn: { gt: new Date() } }],
			},
			select: { id: true, usuarioId: true, ultimoUsoEn: true },
		});
	}

	async marcarUso(id: number, en: Date): Promise<void> {
		await prisma.tokenPersonal.update({
			where: { id },
			data: { ultimoUsoEn: en },
		});
	}

	async rotar(
		refreshHash: string,
		clientId: string,
		nuevas: CredencialesConexion,
	): Promise<number | null> {
		const conexion = await prisma.tokenPersonal.findUnique({
			where: { refreshHash, clientId, revocadoEn: null },
			select: { id: true, usuarioId: true },
		});
		if (!conexion) return null;
		// La condición sobre el refresh viejo hace que, en paralelo, solo una gane.
		const { count } = await prisma.tokenPersonal.updateMany({
			where: { id: conexion.id, refreshHash, revocadoEn: null },
			data: { ...nuevas, ultimoUsoEn: new Date() },
		});
		return count === 1 ? conexion.usuarioId : null;
	}

	async revocar(id: number, usuarioId: number): Promise<boolean> {
		const { count } = await prisma.tokenPersonal.updateMany({
			where: { id, usuarioId, revocadoEn: null },
			data: { revocadoEn: new Date() },
		});
		return count === 1;
	}

	async revocarConexionesSinUso(antesDe: Date): Promise<number> {
		const { count } = await prisma.tokenPersonal.updateMany({
			where: {
				clientId: { not: null },
				revocadoEn: null,
				OR: [
					{ ultimoUsoEn: { lt: antesDe } },
					{ ultimoUsoEn: null, createdAt: { lt: antesDe } },
				],
			},
			data: { revocadoEn: new Date() },
		});
		return count;
	}
}
