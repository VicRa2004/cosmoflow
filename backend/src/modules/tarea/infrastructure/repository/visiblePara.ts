import type { Prisma } from "@/generated/prisma/client";

/** Misma visibilidad que `ContextosTarea`, en una sola consulta. */
export const visiblePara = (usuarioId: number): Prisma.TareaWhereInput => {
	const esMiembro = { some: { usuarioId } };
	return {
		OR: [
			{ usuarioId, organizacionId: null },
			{ responsables: esMiembro },
			{
				equipoId: null,
				proyectoId: null,
				organizacion: { deletedAt: null, miembros: esMiembro },
			},
			{ equipo: { deletedAt: null, miembros: esMiembro } },
			{
				proyecto: {
					deletedAt: null,
					OR: [
						{ integrantes: esMiembro },
						{ equipos: { some: { equipo: { miembros: esMiembro } } } },
					],
				},
			},
		],
	};
};
