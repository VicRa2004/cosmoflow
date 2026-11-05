import { createHash } from "node:crypto";
import type { CodigoOAuthRepository } from "../../domain/CodigoOAuthRepository";
import { ErrorOAuth } from "../../domain/ErrorOAuth";
import { resolverDestino } from "../../domain/destinoConexion";
import { hashearCodigo } from "./AutorizarConexionUseCase";

const CODIGO_INVALIDO = "Código inválido, caducado o ya usado";

/**
 * Canjea el código por un token personal: aparece en el perfil y se revoca como cualquier otro.
 * shortcut: el token no caduca y no hay refresh token; revocado, el cliente pide permiso de nuevo.
 */
export class CanjearCodigoUseCase {
	constructor(
		private readonly repo: CodigoOAuthRepository,
		private readonly tokens: {
			ejecutar(usuarioId: number, nombre: string): Promise<{ token: string }>;
		},
	) {}

	async ejecutar(dto: {
		code: string;
		redirectUri: string;
		clientId: string;
		codeVerifier: string;
	}): Promise<string> {
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
			? "Conexión local (Claude Code u otra app)"
			: `${destino?.nombre} (${destino?.host})`;
		const { token } = await this.tokens.ejecutar(codigo.usuarioId, nombre);
		return token;
	}
}
