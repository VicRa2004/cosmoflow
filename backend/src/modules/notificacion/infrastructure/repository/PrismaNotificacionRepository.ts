import { prisma } from "@/core/config/prisma";
import type { Destinatario } from "../../domain/CanalNotificacion";
import type { Preferencia } from "../../domain/catalogo";
import type {
	NotificacionRepository,
	TareaPorVencer,
} from "../../domain/repository/NotificacionRepository";

export class PrismaNotificacionRepository implements NotificacionRepository {
	async preferencias(usuarioId: number): Promise<Preferencia[]> {
		const filas = await prisma.preferenciaNotificacion.findMany({
			where: { usuarioId },
		});
		// `evento` y `canal` solo se escriben validados contra el catálogo.
		return filas.map(({ evento, canal, activo }) => ({
			evento,
			canal,
			activo,
		})) as Preferencia[];
	}

	async guardarPreferencias(
		usuarioId: number,
		preferencias: Preferencia[],
	): Promise<void> {
		await prisma.$transaction(
			preferencias.map(({ evento, canal, activo }) =>
				prisma.preferenciaNotificacion.upsert({
					where: { usuarioId_evento_canal: { usuarioId, evento, canal } },
					create: { usuarioId, evento, canal, activo },
					update: { activo },
				}),
			),
		);
	}

	async preferenciasOrganizacion(
		organizacionId: number,
	): Promise<Preferencia[]> {
		const filas = await prisma.preferenciaNotificacionOrganizacion.findMany({
			where: { organizacionId },
		});
		return filas.map(({ evento, canal, activo }) => ({
			evento,
			canal,
			activo,
		})) as Preferencia[];
	}

	async guardarPreferenciasOrganizacion(
		organizacionId: number,
		preferencias: Preferencia[],
	): Promise<void> {
		await prisma.$transaction(
			preferencias.map(({ evento, canal, activo }) =>
				prisma.preferenciaNotificacionOrganizacion.upsert({
					where: {
						organizacionId_evento_canal: { organizacionId, evento, canal },
					},
					create: { organizacionId, evento, canal, activo },
					update: { activo },
				}),
			),
		);
	}

	async destinatarios(usuarioIds: number[]): Promise<Destinatario[]> {
		const usuarios = await prisma.usuario.findMany({
			where: { id: { in: usuarioIds }, isActivo: true, deletedAt: null },
			select: {
				id: true,
				email: true,
				nombre: true,
				vinculoTelegram: { select: { chatId: true } },
			},
		});
		return usuarios.map(({ id, email, nombre, vinculoTelegram }) => ({
			usuarioId: id,
			email,
			nombre,
			telegramChatId: vinculoTelegram?.chatId ?? null,
		}));
	}

	async tarea(tareaId: number) {
		return prisma.tarea.findFirst({
			where: { id: tareaId, deletedAt: null },
			select: { titulo: true, organizacionId: true },
		});
	}

	async tareasPorVencer(dias: string[]): Promise<TareaPorVencer[]> {
		const tareas = await prisma.tarea.findMany({
			where: {
				deletedAt: null,
				estado: { in: ["pendiente", "en_progreso"] },
				fechaVencimiento: { in: dias.map((dia) => new Date(dia)) },
			},
			select: {
				id: true,
				titulo: true,
				fechaVencimiento: true,
				organizacionId: true,
				usuarioId: true,
				responsables: { select: { usuarioId: true } },
			},
		});
		return tareas.map(({ fechaVencimiento, responsables, ...tarea }) => ({
			...tarea,
			// `@db.Date` llega como medianoche UTC: el día ISO es su parte de fecha.
			fechaVencimiento: (fechaVencimiento as Date).toISOString().slice(0, 10),
			responsableIds: responsables.map((r) => r.usuarioId),
		}));
	}

	async registrarEnvio(clave: string): Promise<boolean> {
		const { count } = await prisma.notificacionEnviada.createMany({
			data: [{ clave }],
			skipDuplicates: true,
		});
		return count === 1;
	}

	async anularEnvio(clave: string): Promise<void> {
		await prisma.notificacionEnviada.deleteMany({ where: { clave } });
	}

	async purgarEnvios(antesDe: Date): Promise<void> {
		await prisma.notificacionEnviada.deleteMany({
			where: { enviadaEn: { lt: antesDe } },
		});
	}
}
