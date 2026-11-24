import jwt from "jsonwebtoken";
import { env } from "../../../../core/config/env";
import type {
	AccessTokenPayload,
	TokenService,
} from "../../domain/service/TokenService";
import crypto from "node:crypto";

export class JwtService implements TokenService {
	private secreto = env.JWT_SECRET;
	// Secreto distinto: un token de dos pasos no pasa `verificarToken` ni al revés.
	private secretoDosPasos = `${env.JWT_SECRET}:dos-pasos`;

	generarToken(payload: AccessTokenPayload): string {
		return jwt.sign(payload, this.secreto, {
			algorithm: "HS256",
			expiresIn: "1h",
		});
	}

	verificarToken(token: string): AccessTokenPayload {
		// Fijar el algoritmo evita aceptar tokens firmados con otro (p.ej. "none").
		// La firma garantiza que el payload es el que emitió generarToken.
		return jwt.verify(token, this.secreto, {
			algorithms: ["HS256"],
		}) as AccessTokenPayload;
	}

	generarTokenDosPasos(usuarioId: number): string {
		return jwt.sign({ sub: String(usuarioId) }, this.secretoDosPasos, {
			algorithm: "HS256",
			expiresIn: "5m",
		});
	}

	verificarTokenDosPasos(token: string): number {
		const { sub } = jwt.verify(token, this.secretoDosPasos, {
			algorithms: ["HS256"],
		}) as { sub: string };
		return Number(sub);
	}

	generarRefreshToken(): string {
		return crypto.randomBytes(48).toString("hex");
	}

	hashearRefreshToken(token: string): string {
		return crypto.createHash("sha256").update(token).digest("hex");
	}
}
