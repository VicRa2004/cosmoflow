import { prisma } from "@/core/config/prisma";
import { type EstadoInvitacion, Invitacion } from "../../domain/Invitacion";
import type { InvitacionRepository } from "../../domain/repository/InvitacionRepository";

interface PrismaInvitacionRecord {
	id: number;
	organizacionId: number;
	email: string;
	tokenHash: string;
	estado: EstadoInvitacion;
	expiraEn: Date;
	createdAt: Date;
}

export class PrismaInvitacionRepository implements InvitacionRepository {
	private toDomain({ id, ...datos }: PrismaInvitacionRecord): Invitacion {
		return Invitacion.reconstituir(id, datos);
	}

	async buscarPendientes(organizacionId: number): Promise<Invitacion[]> {
		const registros = await prisma.invitacion.findMany({
			where: { organizacionId, estado: "pendiente" },
			orderBy: { createdAt: "desc" },
		});
		return registros.map((registro) => this.toDomain(registro));
	}

	async buscarPorId(
		organizacionId: number,
		id: number,
	): Promise<Invitacion | null> {
		const registro = await prisma.invitacion.findFirst({
			where: { id, organizacionId },
		});
		return registro ? this.toDomain(registro) : null;
	}

	async buscarPendientePorEmail(
		organizacionId: number,
		email: string,
	): Promise<Invitacion | null> {
		const registro = await prisma.invitacion.findFirst({
			where: {
				organizacionId,
				email: email.toLowerCase(),
				estado: "pendiente",
			},
		});
		return registro ? this.toDomain(registro) : null;
	}

	async buscarPorTokenHash(tokenHash: string) {
		const registro = await prisma.invitacion.findFirst({
			where: { tokenHash, organizacion: { deletedAt: null } },
			include: { organizacion: { select: { nombre: true } } },
		});
		if (!registro) return null;
		const { organizacion, ...invitacion } = registro;
		return {
			invitacion: this.toDomain(invitacion),
			nombreOrganizacion: organizacion.nombre,
		};
	}

	async crear(data: Invitacion): Promise<Invitacion> {
		const registro = await prisma.invitacion.create({
			data: {
				organizacionId: data.getOrganizacionId(),
				email: data.getEmail(),
				tokenHash: data.getTokenHash(),
				expiraEn: data.getExpiraEn(),
			},
		});
		return this.toDomain(registro);
	}

	async actualizar(data: Invitacion): Promise<Invitacion> {
		const registro = await prisma.invitacion.update({
			where: { id: data.getId() },
			data: {
				tokenHash: data.getTokenHash(),
				estado: data.getEstado(),
				expiraEn: data.getExpiraEn(),
			},
		});
		return this.toDomain(registro);
	}
}
