import { prisma } from "@/core/config/prisma";
import type { DestinoAviso } from "../../domain/CanalNotificacion";
import {
	EVENTOS_NOTIFICACION,
	type EventoNotificacion,
} from "../../domain/catalogo";
import type {
	BandejaNotificacionRepository,
	CrearNotificacionApp,
	FiltrosBandeja,
	PaginaNotificaciones,
} from "../../domain/repository/BandejaNotificacionRepository";

const aTipo = (valor: string | null): DestinoAviso["tipo"] | null =>
	valor === "tarea" || valor === "nota" ? valor : null;

const aEvento = (valor: string | null): EventoNotificacion | null =>
	EVENTOS_NOTIFICACION.find((e) => e === valor) ?? null;

const persona = { select: { id: true, nombre: true } } as const;

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
				evento: entrada.evento,
				actorId: entrada.actorId,
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
				include: { actor: persona },
			}),
			prisma.notificacion.count({ where }),
			prisma.notificacion.count({ where: { usuarioId, leidaEn: null } }),
		]);

		const tareaIds = registros.flatMap((r) =>
			r.tipo === "tarea" && r.recursoId !== null ? [r.recursoId] : [],
		);
		const filasTarea = await prisma.tarea.findMany({
			where: { id: { in: tareaIds }, deletedAt: null },
			select: {
				id: true,
				titulo: true,
				responsables: {
					select: {
						miembro: { select: { usuario: persona } },
						asignadoPor: persona,
					},
				},
			},
		});
		const tareas = new Map(
			filasTarea.map((t) => [
				t.id,
				{
					titulo: t.titulo,
					responsables: t.responsables.map((resp) => ({
						...resp.miembro.usuario,
						asignadoPor: resp.asignadoPor,
					})),
				},
			]),
		);

		return {
			datos: registros.map((r) => ({
				id: r.id,
				asunto: r.asunto,
				texto: r.texto,
				enlace: r.enlace,
				tipo: aTipo(r.tipo),
				recursoId: r.recursoId,
				evento: aEvento(r.evento),
				actor: r.actor,
				tarea:
					r.tipo === "tarea" && r.recursoId !== null
						? (tareas.get(r.recursoId) ?? null)
						: null,
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
