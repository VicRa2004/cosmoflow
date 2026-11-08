import { prisma } from "@/core/config/prisma";
import type { CarpetaNota as PrismaCarpeta } from "@/generated/prisma/client";
import { CarpetaNota } from "../../domain/CarpetaNota";
import type { CarpetaNotaRepository } from "../../domain/repository/CarpetaNotaRepository";
import type { AmbitoNotas } from "../../domain/repository/NotaRepository";

const toDomain = (raw: PrismaCarpeta) =>
	CarpetaNota.reconstituir(
		raw.id,
		raw.usuarioId,
		{
			nombre: raw.nombre,
			icono: raw.icono,
			color: raw.color,
			padreId: raw.padreId,
		},
		raw.organizacionId && raw.proyectoId
			? { organizacionId: raw.organizacionId, proyectoId: raw.proyectoId }
			: null,
	);

export class PrismaCarpetaNotaRepository implements CarpetaNotaRepository {
	async buscar(ambito: AmbitoNotas): Promise<CarpetaNota[]> {
		const registros = await prisma.carpetaNota.findMany({
			where: {
				// Las personales son las suyas sin proyecto.
				...("usuarioId" in ambito
					? { usuarioId: ambito.usuarioId, proyectoId: null }
					: ambito),
				deletedAt: null,
			},
			orderBy: [{ nombre: "asc" }, { id: "asc" }],
		});
		return registros.map(toDomain);
	}

	async buscarPorId(id: number): Promise<CarpetaNota | null> {
		const registro = await prisma.carpetaNota.findFirst({
			where: { id, deletedAt: null },
		});
		return registro ? toDomain(registro) : null;
	}

	async crear(data: CarpetaNota): Promise<CarpetaNota> {
		return toDomain(
			await prisma.carpetaNota.create({
				data: {
					usuarioId: data.getUsuarioId(),
					...data.getProyecto(),
					...data.getDatos(),
				},
			}),
		);
	}

	async actualizar(data: CarpetaNota): Promise<CarpetaNota> {
		return toDomain(
			await prisma.carpetaNota.update({
				where: { id: data.getId() },
				data: data.getDatos(),
			}),
		);
	}

	async eliminar(id: number): Promise<void> {
		const carpeta = await prisma.carpetaNota.findUniqueOrThrow({
			where: { id },
			select: { padreId: true },
		});
		await prisma.$transaction([
			prisma.carpetaNota.updateMany({
				where: { padreId: id },
				data: { padreId: carpeta.padreId },
			}),
			prisma.nota.updateMany({
				where: { carpetaId: id },
				data: { carpetaId: carpeta.padreId },
			}),
			prisma.carpetaNota.update({
				where: { id },
				data: { deletedAt: new Date() },
			}),
		]);
	}
}
