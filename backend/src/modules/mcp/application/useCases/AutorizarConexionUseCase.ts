import { randomBytes, createHash } from "node:crypto";
import type { CodigoOAuthRepository } from "../../domain/CodigoOAuthRepository";
import { ErrorOAuth } from "../../domain/ErrorOAuth";
import { resolverDestino } from "../../domain/destinoConexion";

const VIGENCIA_MS = 5 * 60 * 1000;

export const hashearCodigo = (codigo: string): string =>
	createHash("sha256").update(codigo).digest("hex");

/** El usuario pulsó «Permitir»: emite el código y devuelve adónde mandarlo. */
export class AutorizarConexionUseCase {
	constructor(private readonly repo: CodigoOAuthRepository) {}

	async ejecutar(
		usuarioId: number,
		dto: {
			clientId: string;
			redirectUri: string;
			codeChallenge: string;
			state?: string;
		},
	): Promise<string> {
		if (!resolverDestino(dto.redirectUri)) {
			throw new ErrorOAuth("invalid_redirect_uri", "Destino no permitido");
		}

		const codigo = randomBytes(32).toString("hex");
		await this.repo.guardar({
			codigoHash: hashearCodigo(codigo),
			usuarioId,
			clientId: dto.clientId,
			redirectUri: dto.redirectUri,
			codeChallenge: dto.codeChallenge,
			expiraEn: new Date(Date.now() + VIGENCIA_MS),
		});

		const destino = new URL(dto.redirectUri);
		destino.searchParams.set("code", codigo);
		if (dto.state) destino.searchParams.set("state", dto.state);
		return destino.href;
	}
}
