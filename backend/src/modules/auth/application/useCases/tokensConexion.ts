import {
	type CredencialesConexion,
	PREFIJO_REFRESH_CONEXION,
	PREFIJO_TOKEN_PERSONAL,
} from "../../domain/repository/TokenPersonalRepository";
import type { TokenService } from "../../domain/service/TokenService";

/** Vida del token de acceso de una conexión OAuth; luego el cliente lo renueva. */
export const DURACION_ACCESO_CONEXION_MS = 60 * 60 * 1000;
/** Una conexión que no se usa (ni se renueva) en este tiempo se revoca sola. */
export const DIAS_CONEXION_SIN_USO = 90;

/** Respuesta de token de OAuth (RFC 6749 §5.1), sin el `token_type`. */
export interface TokensConexion {
	accessToken: string;
	refreshToken: string;
	expiraEnSegundos: number;
}

/** Tokens nuevos en claro (solo para la respuesta) y lo que se guarda de ellos; el refresh se puede conservar. */
export function generarCredenciales(
	tokenService: TokenService,
	refreshToken = `${PREFIJO_REFRESH_CONEXION}${tokenService.generarRefreshToken()}`,
): {
	tokens: TokensConexion;
	credenciales: CredencialesConexion;
} {
	const aleatorio = tokenService.generarRefreshToken();
	const accessToken = `${PREFIJO_TOKEN_PERSONAL}${aleatorio}`;
	return {
		tokens: {
			accessToken,
			refreshToken,
			expiraEnSegundos: DURACION_ACCESO_CONEXION_MS / 1000,
		},
		credenciales: {
			tokenHash: tokenService.hashearRefreshToken(accessToken),
			pista: aleatorio.slice(-4),
			refreshHash: tokenService.hashearRefreshToken(refreshToken),
			expiraEn: new Date(Date.now() + DURACION_ACCESO_CONEXION_MS),
		},
	};
}
