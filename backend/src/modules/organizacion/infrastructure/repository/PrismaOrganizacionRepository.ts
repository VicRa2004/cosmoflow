import { prisma } from "@/core/config/prisma";
import type { Paginacion } from "@/core/shared/domain/Paginacion";
import type { Miembro } from "../../domain/Miembro";
import { Organizacion } from "../../domain/Organizacion";
import type {
	OrganizacionDelMiembro,
	OrganizacionFiltros,
	OrganizacionRepository,
} from "../../domain/repository/OrganizacionRepository";

interface PrismaOrganizacionRecord {
	id: number;
	nombre: string;
	descripcion: string;
	color: string;
	avatar: string | null;
}

export class PrismaOrganizacionRepository implements OrganizacionRepository {
	private toDomain({ id, ...datos }: PrismaOrganizacionRecord): Organizacion {
		return Organizacion.reconstituir(id, datos);
	}

	async buscar(
		usuarioId: number,
		{ pagina, limite, nombre }: OrganizacionFiltros,
	): Promise<Paginacion<OrganizacionDelMiembro>> {
		const where = {
			usuarioId,
			organizacion: {
				deletedAt: null,
				...(nombre && {
					nombre: { contains: nombre, mode: "insensitive" as const },
				}),
			},
		};

		const [registros, totalElementos] = await prisma.$transaction([
			prisma.miembroOrganizacion.findMany({
				where,
				include: { organizacion: true },
				skip: (pagina - 1) * limite,
				take: limite,
				orderBy: { organizacion: { nombre: "asc" } },
			}),
			prisma.miembroOrganizacion.count({ where }),
		]);

		return {
			datos: registros.map((registro) => ({
				organizacion: this.toDomain(registro.organizacion),
				isAdmin: registro.isAdmin,
			})),
			pagina,
			totalElementos,
			totalPaginas: Math.ceil(totalElementos / limite),
		};
	}

	async buscarPorId(
		usuarioId: number,
		id: number,
	): Promise<OrganizacionDelMiembro | null> {
		const registro = await prisma.miembroOrganizacion.findFirst({
			where: {
				usuarioId,
				organizacionId: id,
				organizacion: { deletedAt: null },
			},
			include: { organizacion: true },
		});
		return registro
			? {
					organizacion: this.toDomain(registro.organizacion),
					isAdmin: registro.isAdmin,
				}
			: null;
	}

	async crear(data: Organizacion, adminId: number): Promise<Organizacion> {
		const registro = await prisma.organizacion.create({
			data: {
				nombre: data.getNombre(),
				descripcion: data.getDescripcion(),
				color: data.getColor(),
				miembros: { create: { usuarioId: adminId, isAdmin: true } },
			},
		});
		return this.toDomain(registro);
	}

	async actualizar(data: Organizacion): Promise<Organizacion> {
		const registro = await prisma.organizacion.update({
			where: { id: data.getId() },
			data: {
				nombre: data.getNombre(),
				descripcion: data.getDescripcion(),
				color: data.getColor(),
				avatar: data.getAvatar(),
			},
		});
		return this.toDomain(registro);
	}

	async esMiembroPorEmail(
		organizacionId: number,
		email: string,
	): Promise<boolean> {
		const miembro = await prisma.miembroOrganizacion.findFirst({
			where: {
				organizacionId,
				usuario: {
					email: { equals: email, mode: "insensitive" },
					deletedAt: null,
				},
			},
		});
		return miembro !== null;
	}

	async agregarMiembro(
		organizacionId: number,
		usuarioId: number,
	): Promise<void> {
		await prisma.miembroOrganizacion.upsert({
			where: { organizacionId_usuarioId: { organizacionId, usuarioId } },
			update: {},
			create: { organizacionId, usuarioId },
		});
	}

	async buscarMiembros(organizacionId: number): Promise<Miembro[]> {
		const registros = await prisma.miembroOrganizacion.findMany({
			where: { organizacionId, usuario: { deletedAt: null } },
			include: {
				usuario: { select: { nombre: true, email: true, avatar: true } },
			},
			orderBy: [{ isAdmin: "desc" }, { usuario: { nombre: "asc" } }],
		});
		return registros.map(({ usuarioId, isAdmin, createdAt, usuario }) => ({
			usuarioId,
			isAdmin,
			createdAt,
			...usuario,
		}));
	}

	async quitarMiembro(
		organizacionId: number,
		usuarioId: number,
	): Promise<void> {
		await prisma.miembroOrganizacion.delete({
			where: { organizacionId_usuarioId: { organizacionId, usuarioId } },
		});
	}

	async delegarAdministracion(
		organizacionId: number,
		deUsuarioId: number,
		aUsuarioId: number,
	): Promise<void> {
		// Las dos filas a la vez: nunca hay dos admins ni ninguno.
		await prisma.$transaction([
			prisma.miembroOrganizacion.update({
				where: {
					organizacionId_usuarioId: { organizacionId, usuarioId: deUsuarioId },
				},
				data: { isAdmin: false },
			}),
			prisma.miembroOrganizacion.update({
				where: {
					organizacionId_usuarioId: { organizacionId, usuarioId: aUsuarioId },
				},
				data: { isAdmin: true },
			}),
		]);
	}

	async eliminar(id: number): Promise<void> {
		await prisma.organizacion.update({
			where: { id },
			data: { deletedAt: new Date() },
		});
	}
}
