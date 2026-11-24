import { apiClient } from "@/core/api/client";
import type { AuthResponse } from "@/core/auth/types";
import type { AuthTokens } from "@/core/auth/types";
import type { components } from "@/core/api/schema.gen";
import type { LoginInput, RegistroInput } from "../schemas/authSchemas";

interface Mensaje {
	mensaje: string;
}

export type TokenPersonal = components["schemas"]["TokenPersonalDto"];
export type AlcanceToken = components["schemas"]["AlcanceToken"];
type TokenPersonalCreado = components["schemas"]["TokenPersonalCreado"];
export type SesionDto = components["schemas"]["SesionDto"];
type DosPasosRequerido = components["schemas"]["DosPasosRequerido"];
type DosPasosEstado = components["schemas"]["DosPasosEstado"];

export const authApi = {
	async tokensPersonales(): Promise<TokenPersonal[]> {
		const response = await apiClient.get<TokenPersonal[]>("/tokens-personales");
		return response.data;
	},

	async crearTokenPersonal(data: {
		nombre: string;
	}): Promise<TokenPersonalCreado> {
		const response = await apiClient.post<TokenPersonalCreado>(
			"/tokens-personales",
			data,
		);
		return response.data;
	},

	async cambiarAlcancesToken({
		id,
		alcances,
	}: {
		id: number;
		alcances: AlcanceToken[] | null;
	}): Promise<void> {
		await apiClient.put(`/tokens-personales/${id}/alcances`, { alcances });
	},

	async revocarTokenPersonal(id: number): Promise<void> {
		await apiClient.delete(`/tokens-personales/${id}`);
	},

	// Con la verificación en dos pasos activa no hay sesión aún: falta el código.
	async login(
		credentials: LoginInput,
	): Promise<AuthResponse | DosPasosRequerido> {
		const response = await apiClient.post<AuthResponse | DosPasosRequerido>(
			"/auth/login",
			credentials,
		);
		return response.data;
	},

	async loginDosPasos(datos: {
		tokenDosPasos: string;
		codigo: string;
	}): Promise<AuthResponse> {
		const response = await apiClient.post<AuthResponse>(
			"/auth/login/dos-pasos",
			datos,
		);
		return response.data;
	},

	async dosPasos(): Promise<DosPasosEstado> {
		const response = await apiClient.get<DosPasosEstado>("/auth/dos-pasos");
		return response.data;
	},

	async iniciarDosPasos(): Promise<{ secreto: string; uri: string }> {
		const response = await apiClient.post<{ secreto: string; uri: string }>(
			"/auth/dos-pasos/iniciar",
		);
		return response.data;
	},

	async activarDosPasos(codigo: string): Promise<string[]> {
		const response = await apiClient.post<{ codigosRecuperacion: string[] }>(
			"/auth/dos-pasos/activar",
			{ codigo },
		);
		return response.data.codigosRecuperacion;
	},

	async desactivarDosPasos(datos: {
		password?: string;
		codigo?: string;
	}): Promise<Mensaje> {
		const response = await apiClient.post<Mensaje>(
			"/auth/dos-pasos/desactivar",
			datos,
		);
		return response.data;
	},

	async registro(data: RegistroInput): Promise<AuthResponse> {
		const response = await apiClient.post<AuthResponse>("/auth/registro", data);
		return response.data;
	},

	// Canjea la cookie del refresh token por una sesión (vuelta del login con Google).
	async sesion(): Promise<AuthResponse> {
		const response = await apiClient.post<AuthResponse>("/auth/refresh");
		return response.data;
	},

	// Revoca el refresh token de la cookie httpOnly y la borra.
	async logout(): Promise<{ mensaje: string }> {
		const response = await apiClient.post<{ mensaje: string }>("/auth/logout");
		return response.data;
	},

	async recuperarPassword(email: string): Promise<Mensaje> {
		const response = await apiClient.post<Mensaje>("/auth/recuperar-password", {
			email,
		});
		return response.data;
	},

	async restablecerPassword(datos: {
		token: string;
		password: string;
	}): Promise<Mensaje> {
		const response = await apiClient.post<Mensaje>(
			"/auth/restablecer-password",
			datos,
		);
		return response.data;
	},

	async verificarEmail(token: string): Promise<Mensaje> {
		const response = await apiClient.post<Mensaje>("/auth/verificar-email", {
			token,
		});
		return response.data;
	},

	async reenviarVerificacion(): Promise<Mensaje> {
		const response = await apiClient.post<Mensaje>(
			"/auth/verificar-email/reenviar",
		);
		return response.data;
	},

	// Devuelve una sesión nueva: el backend revoca todas las anteriores.
	async cambiarPassword(datos: {
		passwordActual: string;
		passwordNueva: string;
	}): Promise<AuthTokens> {
		const response = await apiClient.put<AuthTokens>("/auth/password", datos);
		return response.data;
	},

	async cerrarSesiones(): Promise<Mensaje> {
		const response = await apiClient.post<Mensaje>("/auth/logout-todas");
		return response.data;
	},

	async sesiones(): Promise<SesionDto[]> {
		const response = await apiClient.get<SesionDto[]>("/auth/sesiones");
		return response.data;
	},

	async revocarSesion(id: number): Promise<void> {
		await apiClient.delete(`/auth/sesiones/${id}`);
	},
};
