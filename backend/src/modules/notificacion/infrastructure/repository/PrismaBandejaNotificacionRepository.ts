import { prisma } from "@/core/config/prisma";
import type { DestinoAviso } from "../../domain/CanalNotificacion";
import type {
	BandejaNotificacionRepository,
	CrearNotificacionApp,
	FiltrosBandeja,
	PaginaNotificaciones,
} from "../../domain/repository/BandejaNotificacionRepository";

const aTipo = (valor: string | null): DestinoAviso["tipo"] | null =>
	valor === "tarea" || valor === "nota" ? valor : null;

export class PrismaBandejaNotificacionRepository
	implements BandejaNotificacionRepository
{
	async crear(entrada: CrearNotificacionApp): Promise<void> {
		await prisma.notificacion.create({
			data: {
				usuarioId: entrada.usuarioId,
				asunto: entrada.asunto.slice(0, 255),
				texto: entrada.texto,
				enlace: entrada.enlace.slice(0, 512),
				tipo: entrada.tipo,
				recursoId: entrada.recursoId,
			},
		});
	}

	async buscar(
		usuarioId: number,
		{ pagina, limite, soloNoLeidas }: FiltrosBandeja,
	): Promise<PaginaNotificaciones> {
		const where = {
			usuarioId,
			...(soloNoLeidas ? { leidaEn: null } : {}),
		};
		const [registros, totalElementos, noLeidas] = await prisma.$transaction([
			prisma.notificacion.findMany({
				where,
				orderBy: [{ id: "desc" }],
				skip: (pagina - 1) * limite,
				take: limite,
			}),
			prisma.notificacion.count({ where }),
			prisma.notificacion.count({ where: { usuarioId, leidaEn: null } }),
		]);

		return {
			datos: registros.map((r) => ({
				id: r.id,
				asunto: r.asunto,
				texto: r.texto,
				enlace: r.enlace,
				tipo: aTipo(r.tipo),
				recursoId: r.recursoId,
				leida: r.leidaEn !== null,
				createdAt: r.createdAt.toISOString(),
			})),
			pagina,
			totalElementos,
			totalPaginas: Math.ceil(totalElementos / limite),
			noLeidas,
		};
	}

	async marcarLeida(usuarioId: number, id: number): Promise<boolean> {
		const existente = await prisma.notificacion.findFirst({
			where: { id, usuarioId },
			select: { id: true, leidaEn: true },
		});
		if (!existente) return false;
		if (existente.leidaEn === null) {
			await prisma.notificacion.update({
				where: { id },
				data: { leidaEn: new Date() },
			});
		}
		return true;
	}

	async marcarTodasLeidas(usuarioId: number): Promise<number> {
		const { count } = await prisma.notificacion.updateMany({
			where: { usuarioId, leidaEn: null },
			data: { leidaEn: new Date() },
		});
		return count;
	}

	async purgarLeidas(antesDe: Date): Promise<number> {
		const { count } = await prisma.notificacion.deleteMany({
			where: { leidaEn: { lt: antesDe } },
		});
		return count;
	}
}
