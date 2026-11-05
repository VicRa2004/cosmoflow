import { prisma } from "@/core/config/prisma";
import type {
	CodigoOAuth,
	CodigoOAuthRepository,
} from "../../domain/CodigoOAuthRepository";

export class PrismaCodigoOAuthRepository implements CodigoOAuthRepository {
	async guardar(
		data: CodigoOAuth & { codigoHash: string; expiraEn: Date },
	): Promise<void> {
		await prisma.codigoOAuth.create({ data });
	}

	async consumir(codigoHash: string): Promise<CodigoOAuth | null> {
		// DELETE … RETURNING: dos canjes simultáneos no pueden recibir ambos la fila.
		const [fila] = await prisma.$queryRaw<CodigoOAuth[]>`
			DELETE FROM "codigo_oauth"
			WHERE "cdo_codigo_hash" = ${codigoHash} AND "cdo_expira_en" > NOW()
			RETURNING "cdo_fkusuario" AS "usuarioId", "cdo_client_id" AS "clientId",
				"cdo_redirect_uri" AS "redirectUri", "cdo_code_challenge" AS "codeChallenge"`;
		return fila ?? null;
	}

	async eliminarCaducados(): Promise<void> {
		await prisma.codigoOAuth.deleteMany({
			where: { expiraEn: { lt: new Date() } },
		});
	}
}
