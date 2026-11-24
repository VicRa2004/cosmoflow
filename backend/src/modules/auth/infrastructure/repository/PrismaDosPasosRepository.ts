import { prisma } from "@/core/config/prisma";
import type {
	DosPasos,
	DosPasosRepository,
} from "../../domain/repository/DosPasosRepository";
import { cifrar, descifrar } from "../service/cifradoSecretos";

export class PrismaDosPasosRepository implements DosPasosRepository {
	async obtener(usuarioId: number): Promise<DosPasos | null> {
		const fila = await prisma.dosPasos.findUnique({
			where: { usuarioId },
			select: {
				secretoCifrado: true,
				activadoEn: true,
				_count: {
					select: { codigosRecuperacion: { where: { usadoEn: null } } },
				},
			},
		});
		if (!fila) return null;
		return {
			secreto: descifrar(fila.secretoCifrado),
			isActivo: fila.activadoEn !== null,
			codigosRestantes: fila._count.codigosRecuperacion,
		};
	}

	async guardarPendiente(usuarioId: number, secreto: string): Promise<void> {
		const secretoCifrado = cifrar(secreto);
		await prisma.dosPasos.upsert({
			where: { usuarioId },
			create: { usuarioId, secretoCifrado },
			update: { secretoCifrado, activadoEn: null, ultimoPaso: 0 },
		});
	}

	async activar(
		usuarioId: number,
		paso: number,
		codigosHash: string[],
	): Promise<void> {
		await prisma.$transaction([
			prisma.codigoRecuperacion.deleteMany({ where: { usuarioId } }),
			prisma.dosPasos.update({
				where: { usuarioId },
				data: { activadoEn: new Date(), ultimoPaso: paso },
			}),
			prisma.codigoRecuperacion.createMany({
				data: codigosHash.map((codigoHash) => ({ usuarioId, codigoHash })),
			}),
		]);
	}

	async marcarPaso(usuarioId: number, paso: number): Promise<boolean> {
		const { count } = await prisma.dosPasos.updateMany({
			where: { usuarioId, ultimoPaso: { lt: paso } },
			data: { ultimoPaso: paso },
		});
		return count === 1;
	}

	async consumirCodigoRecuperacion(
		usuarioId: number,
		codigoHash: string,
	): Promise<boolean> {
		const { count } = await prisma.codigoRecuperacion.updateMany({
			where: { usuarioId, codigoHash, usadoEn: null },
			data: { usadoEn: new Date() },
		});
		return count === 1;
	}

	async eliminar(usuarioId: number): Promise<void> {
		await prisma.dosPasos.deleteMany({ where: { usuarioId } });
	}
}
