import { prisma } from "@/core/config/prisma";
import { Prisma } from "@/generated/prisma/client";
import type { Alcance } from "../../domain/alcances";
import type {
	CredencialesConexion,
	TokenPersonal,
	TokenPersonalRepository,
} from "../../domain/repository/TokenPersonalRepository";

const campos = {
	id: true,
	nombre: true,
	pista: true,
	createdAt: true,
	ultimoUsoEn: true,
	clientId: true,
	alcances: true,
};

// Lo escribió este repositorio con valores ya validados por el schema HTTP.
const leerAlcances = (valor: Prisma.JsonValue): Alcance[] | null =>
	(valor ?? null) as Alcance[] | null;

const aToken = ({
	clientId,
	alcances,
	...fila
}: Prisma.TokenPersonalGetPayload<{
	select: typeof campos;
}>): TokenPersonal => ({
	...fila,
	esConexion: clientId !== null,
	alcances: leerAlcances(alcances),
});

const guardarAlcances = (alcances: Alcance[] | null) =>
	alcances ?? Prisma.DbNull;

export class PrismaTokenPersonalRepository implements TokenPersonalRepository {
	async crear({
		alcances,
		...data
	}: {
		nombre: string;
		tokenHash: string;
		pista: string;
		usuarioId: number;
		alcances: Alcance[] | null;
	}): Promise<TokenPersonal> {
		return aToken(
			await prisma.tokenPersonal.create({
				data: { ...data, alcances: guardarAlcances(alcances) },
				select: campos,
			}),
		);
	}

	async crearConexion(
		data: CredencialesConexion & {
			nombre: string;
			usuarioId: number;
			clientId: string;
		},
	): Promise<void> {
		await prisma.tokenPersonal.create({
			data: { ...data, ultimoUsoEn: new Date() },
		});
	}

	async listar(usuarioId: number): Promise<TokenPersonal[]> {
		const filas = await prisma.tokenPersonal.findMany({
			where: { usuarioId, revocadoEn: null },
			select: campos,
			orderBy: { id: "desc" },
		});
		return filas.map(aToken);
	}

	async buscarPorHash(tokenHash: string): Promise<{
		id: number;
		usuarioId: number;
		ultimoUsoEn: Date | null;
		alcances: Alcance[] | null;
	} | null> {
		const fila = await prisma.tokenPersonal.findUnique({
			where: {
				tokenHash,
				revocadoEn: null,
				OR: [{ expiraEn: null }, { expiraEn: { gt: new Date() } }],
			},
			select: { id: true, usuarioId: true, ultimoUsoEn: true, alcances: true },
		});
		return fila && { ...fila, alcances: leerAlcances(fila.alcances) };
	}

	async marcarUso(id: number, en: Date): Promise<void> {
		await prisma.tokenPersonal.update({
			where: { id },
			data: { ultimoUsoEn: en },
		});
	}

	async rotar(
		refreshHash: string,
		clientId: string,
		nuevas: CredencialesConexion,
	): Promise<number | null> {
		const conexion = await prisma.tokenPersonal.findUnique({
			where: { refreshHash, clientId, revocadoEn: null },
			select: { id: true, usuarioId: true },
		});
		if (!conexion) return null;
		// La condición sobre el refresh viejo hace que, en paralelo, solo una gane.
		const { count } = await prisma.tokenPersonal.updateMany({
			where: { id: conexion.id, refreshHash, revocadoEn: null },
			data: { ...nuevas, ultimoUsoEn: new Date() },
		});
		return count === 1 ? conexion.usuarioId : null;
	}

	async cambiarAlcances(
		id: number,
		usuarioId: number,
		alcances: Alcance[] | null,
	): Promise<boolean> {
		const { count } = await prisma.tokenPersonal.updateMany({
			where: { id, usuarioId, revocadoEn: null },
			data: { alcances: guardarAlcances(alcances) },
		});
		return count === 1;
	}

	async revocar(id: number, usuarioId: number): Promise<boolean> {
		const { count } = await prisma.tokenPersonal.updateMany({
			where: { id, usuarioId, revocadoEn: null },
			data: { revocadoEn: new Date() },
		});
		return count === 1;
	}

	async revocarConexionesSinUso(antesDe: Date): Promise<number> {
		const { count } = await prisma.tokenPersonal.updateMany({
			where: {
				clientId: { not: null },
				revocadoEn: null,
				OR: [
					{ ultimoUsoEn: { lt: antesDe } },
					{ ultimoUsoEn: null, createdAt: { lt: antesDe } },
				],
			},
			data: { revocadoEn: new Date() },
		});
		return count;
	}
}
