import { randomBytes } from "node:crypto";
import { prisma } from "@/core/config/prisma";
import type {
	DatosCuentaRepository,
	DatosExportados,
} from "../../domain/repository/DatosCuentaRepository";

// Lee y borra en tablas de varios módulos (como `busqueda`): es la única pieza que
// conoce todo lo que pertenece a un usuario. Una tabla nueva con datos personales
// debe añadirse aquí.
export class PrismaDatosCuentaRepository implements DatosCuentaRepository {
	async organizacionesSinOtroAdmin(usuarioId: number): Promise<string[]> {
		const organizaciones = await prisma.organizacion.findMany({
			where: {
				deletedAt: null,
				miembros: { some: { usuarioId, isAdmin: true } },
				NOT: {
					miembros: {
						some: {
							isAdmin: true,
							usuarioId: { not: usuarioId },
							usuario: { deletedAt: null },
						},
					},
				},
			},
			select: { nombre: true },
			orderBy: { nombre: "asc" },
		});
		return organizaciones.map((o) => o.nombre);
	}

	async darDeBaja(usuarioId: number): Promise<string[]> {
		const [usuario, adjuntos] = await Promise.all([
			prisma.usuario.findUniqueOrThrow({
				where: { id: usuarioId },
				select: { avatar: true },
			}),
			prisma.adjunto.findMany({
				where: { usuarioId, organizacionId: null },
				select: { clave: true },
			}),
		]);
		const personal = { usuarioId, organizacionId: null };
		const delUsuario = { where: { usuarioId } };

		await prisma.tarea.deleteMany({ where: personal });
		await prisma.nota.deleteMany({ where: personal });
		await prisma.carpetaNota.deleteMany({ where: personal });
		await prisma.adjunto.deleteMany({ where: personal });
		await prisma.tag.deleteMany(delUsuario);
		await prisma.plantillaTarea.deleteMany(delUsuario);
		// Sale de sus organizaciones (y con ello de equipos, proyectos y responsables).
		await prisma.miembroOrganizacion.deleteMany(delUsuario);
		await prisma.refreshToken.deleteMany(delUsuario);
		await prisma.tokenCuenta.deleteMany(delUsuario);
		await prisma.tokenPersonal.deleteMany(delUsuario);
		await prisma.codigoOAuth.deleteMany(delUsuario);
		await prisma.dosPasos.deleteMany(delUsuario);
		await prisma.preferenciaNotificacion.deleteMany(delUsuario);
		await prisma.preferenciaInterfaz.deleteMany(delUsuario);
		await prisma.vinculoTelegram.deleteMany(delUsuario);
		await prisma.suscripcionCalendario.deleteMany(delUsuario);
		await prisma.dispositivoPush.deleteMany(delUsuario);
		await prisma.notificacion.deleteMany(delUsuario);
		await prisma.tareaMencion.deleteMany(delUsuario);
		await prisma.claveIdempotencia.deleteMany(delUsuario);
		await prisma.usuarioRol.deleteMany(delUsuario);
		await prisma.usuarioPermiso.deleteMany(delUsuario);

		// La fila se queda (borrado lógico) porque la referencian sus tareas, notas y
		// comentarios compartidos; se anonimiza y libera el email.
		await prisma.usuario.update({
			where: { id: usuarioId },
			data: {
				email: `eliminado-${usuarioId}@cuenta-eliminada.invalid`,
				nombre: "Usuario eliminado",
				password: randomBytes(32).toString("hex"),
				googleId: null,
				avatar: null,
				emailVerificadoEn: null,
				isActivo: false,
				deletedAt: new Date(),
			},
		});

		return [
			...(usuario.avatar ? [usuario.avatar] : []),
			...adjuntos.map((a) => a.clave),
		];
	}

	async exportar(usuarioId: number): Promise<DatosExportados> {
		const [tareas, notas, carpetas] = await Promise.all([
			prisma.tarea.findMany({
				where: { usuarioId, deletedAt: null },
				orderBy: { id: "asc" },
				select: {
					id: true,
					titulo: true,
					contenido: true,
					estado: true,
					prioridad: true,
					fechaInicio: true,
					fechaVencimiento: true,
					organizacionId: true,
					equipoId: true,
					proyectoId: true,
					createdAt: true,
					updatedAt: true,
					subtareas: {
						orderBy: { orden: "asc" },
						select: { titulo: true, completada: true },
					},
				},
			}),
			prisma.nota.findMany({
				where: { usuarioId, deletedAt: null },
				orderBy: { id: "asc" },
				select: {
					id: true,
					titulo: true,
					contenido: true,
					carpetaId: true,
					organizacionId: true,
					proyectoId: true,
					createdAt: true,
					updatedAt: true,
				},
			}),
			prisma.carpetaNota.findMany({
				where: { usuarioId, deletedAt: null },
				select: { id: true, nombre: true, padreId: true },
			}),
		]);
		return { tareas, notas, carpetas };
	}
}
