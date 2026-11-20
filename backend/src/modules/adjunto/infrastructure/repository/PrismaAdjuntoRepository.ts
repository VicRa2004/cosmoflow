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

	// Consulta las tablas de tareas y notas sin importar sus módulos: solo el dato.
	// shortcut: recorre los contenidos por cada adjunto (sin índice); con muchos datos, guardar los enlaces en una tabla al guardar.
	buscarHuerfanos(
		antesDe: Date,
		limite: number,
	): Promise<{ id: number; clave: string }[]> {
		return prisma.$queryRaw<{ id: number; clave: string }[]>`
			SELECT a.adj_id AS id, a.adj_clave AS clave
			FROM adjunto a
			WHERE a.created_at < ${antesDe}
				AND NOT EXISTS (
					SELECT 1 FROM tarea t
					WHERE t.tar_contenido ~ ('/api/adjuntos/' || a.adj_id || '([^0-9]|$)')
				)
				AND NOT EXISTS (
					SELECT 1 FROM nota n
					WHERE n.not_contenido ~ ('/api/adjuntos/' || a.adj_id || '([^0-9]|$)')
				)
			ORDER BY a.adj_id
			LIMIT ${limite}`;
	}

	async eliminar(id: number): Promise<void> {
		await prisma.adjunto.delete({ where: { id } });
	}

	async pasarAOrganizacion(
		organizacionId: number,
		grupo: { equipoId: number } | { proyectoId: number },
	): Promise<void> {
		await prisma.adjunto.updateMany({
			where: grupo,
			data: { organizacionId, equipoId: null, proyectoId: null },
		});
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
