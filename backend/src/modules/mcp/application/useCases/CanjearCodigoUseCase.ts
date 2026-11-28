import { createHash } from "node:crypto";
import type { CodigoOAuthRepository } from "../../domain/CodigoOAuthRepository";
import { ErrorOAuth } from "../../domain/ErrorOAuth";
import { resolverDestino } from "../../domain/destinoConexion";
import { hashearCodigo } from "./AutorizarConexionUseCase";

const CODIGO_INVALIDO = "Código inválido, caducado o ya usado";

/** Tokens de OAuth: acceso que caduca y refresh para renovarlo. */
export interface TokensOAuth {
	accessToken: string;
	refreshToken: string;
	expiraEnSegundos: number;
}

/**
 * Canjea el código por una conexión: un token personal que caduca y se renueva,
 * aparece en el perfil y se revoca como cualquier otro.
 */
export class CanjearCodigoUseCase {
	constructor(
		private readonly repo: CodigoOAuthRepository,
		private readonly tokens: {
			ejecutar(dto: {
				usuarioId: number;
				nombre: string;
				clientId: string;
			}): Promise<TokensOAuth>;
		},
	) {}

	async ejecutar(dto: {
		code: string;
		redirectUri: string;
		clientId: string;
		codeVerifier: string;
	}): Promise<TokensOAuth> {
		// Se consume antes de comprobar nada: un intento fallido también lo quema.
		const codigo = await this.repo.consumir(hashearCodigo(dto.code));
		const reto = createHash("sha256")
			.update(dto.codeVerifier)
			.digest("base64url");
		if (
			!codigo ||
			codigo.redirectUri !== dto.redirectUri ||
			codigo.clientId !== dto.clientId ||
			codigo.codeChallenge !== reto
		) {
			throw new ErrorOAuth("invalid_grant", CODIGO_INVALIDO);
		}

		const destino = resolverDestino(codigo.redirectUri);
		const nombre = destino?.esLocal
			? "Conexión local (terminal o app de escritorio)"
			: `${destino?.nombre} (${destino?.host})`;
		return this.tokens.ejecutar({
			usuarioId: codigo.usuarioId,
			nombre,
			clientId: codigo.clientId,
		});
	}
}
