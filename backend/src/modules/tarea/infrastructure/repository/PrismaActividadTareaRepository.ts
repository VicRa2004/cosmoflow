import { prisma } from "@/core/config/prisma";
import {
	type ActividadTarea,
	type ActividadTareaRepository,
	EVENTOS_ACTIVIDAD,
	type EntradaActividad,
} from "../../domain/repository/ActividadTareaRepository";

const usuariosCitados = (datos: unknown): number[] => {
	const ids = (datos as { usuarioIds?: unknown })?.usuarioIds;
	return Array.isArray(ids) ? ids.filter((id) => typeof id === "number") : [];
};

/** Lee la tabla `auditoria` (la llena el módulo auditoria con cada evento). */
export class PrismaActividadTareaRepository
	implements ActividadTareaRepository
{
	async listar(
		tareaId: number,
		{ antesDe, limite }: { antesDe?: number; limite: number },
	): Promise<ActividadTarea> {
		// shortcut: sin índice por `aud_datos->>'tareaId'` (filtra el índice de evento); añadir uno de expresión si la auditoría crece mucho.
		const registros = await prisma.auditoria.findMany({
			where: {
				evento: { in: [...EVENTOS_ACTIVIDAD] },
				datos: { path: ["tareaId"], equals: tareaId },
				...(antesDe ? { id: { lt: antesDe } } : {}),
			},
			orderBy: { id: "desc" },
			take: limite + 1,
		});
		const pagina = registros.slice(0, limite);
		const ids = [
			...new Set(
				pagina.flatMap((r) => [
					...(r.usuarioId === null ? [] : [r.usuarioId]),
					...usuariosCitados(r.datos),
				]),
			),
		];
		const usuarios = await prisma.usuario.findMany({
			where: { id: { in: ids } },
			select: { id: true, nombre: true },
		});
		return {
			datos: pagina.map(
				(r): EntradaActividad => ({
					id: r.id,
					evento: r.evento as EntradaActividad["evento"],
					datos: r.datos,
					actorId: r.usuarioId,
					ocurridoEn: r.ocurridoEn,
				}),
			),
			nombres: Object.fromEntries(usuarios.map((u) => [u.id, u.nombre])),
			hayMas: registros.length > limite,
		};
	}
}
