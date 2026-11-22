import axios, {
	type AxiosResponse,
	type InternalAxiosRequestConfig,
	isAxiosError,
} from "axios";
import { useAuthStore } from "@/core/auth/store";
import type { AuthTokens } from "@/core/auth/types";
import { reportarErrorApi } from "@/core/monitoreo";
import type { ErrorResponse } from "./schema.gen";

interface CustomAxiosRequestConfig extends InternalAxiosRequestConfig {
	_retry?: boolean;
}

export const apiClient = axios.create({
	baseURL: "/api",
	headers: {
		"Content-Type": "application/json",
	},
});

// Una sola renovación en vuelo (en esta pestaña y entre pestañas): el backend
// rota el refresh token, así que peticiones 401 simultáneas invalidarían la sesión.
let refreshPromise: Promise<string> | null = null;

async function ejecutarRefresh(tokenFallido: string | null): Promise<string> {
	// Si otra pestaña ya renovó el accessToken mientras esperábamos el lock,
	// reutilizamos el nuevo sin volver a rotar la cookie.
	await useAuthStore.persist.rehydrate();
	const tokenActual = useAuthStore.getState().accessToken;
	if (tokenActual && tokenActual !== tokenFallido) {
		return tokenActual;
	}

	// Llamada directa sin interceptores para evitar bucles. El refresh token
	// viaja solo en la cookie httpOnly (mismo origen vía el proxy /api).
	const { data } = await axios.post<AuthTokens>(
		"/api/auth/refresh",
		undefined,
		{
			withCredentials: true,
		},
	);

	useAuthStore.getState().setTokens({ accessToken: data.accessToken });
	return data.accessToken;
}

function refreshAccessToken(tokenFallido: string | null): Promise<string> {
	refreshPromise ??= (async () => {
		if (typeof navigator !== "undefined" && navigator.locks?.request) {
			return navigator.locks.request("cosmoflow-auth-refresh", () =>
				ejecutarRefresh(tokenFallido),
			);
		}
		return ejecutarRefresh(tokenFallido);
	})().finally(() => {
		refreshPromise = null;
	});
	return refreshPromise;
}

function esRechazoDeSesion(error: unknown): boolean {
	if (!isAxiosError(error) || !error.response) return false;
	const { status } = error.response;
	return status === 400 || status === 401 || status === 403;
}

// Request Interceptor: Inyectar token de autenticación
apiClient.interceptors.request.use(
	(config: InternalAxiosRequestConfig) => {
		const token = useAuthStore.getState().accessToken;
		if (token && config.headers) {
			config.headers.Authorization = `Bearer ${token}`;
		}
		return config;
	},
	(error: unknown) => {
		return Promise.reject(error);
	},
);

// Response Interceptor: Manejo de 401 y Refresh Token automático
apiClient.interceptors.response.use(
	(response: AxiosResponse) => response,
	async (error: unknown) => {
		if (!isAxiosError<ErrorResponse>(error) || !error.config) {
			return Promise.reject(error);
		}
		reportarErrorApi(error);

		const originalRequest = error.config as CustomAxiosRequestConfig;

		if (error.response?.status === 401 && !originalRequest._retry) {
			originalRequest._retry = true;
			const { isAuthenticated, logout } = useAuthStore.getState();

			// Sin sesión (p.ej. credenciales inválidas en el login) no hay qué renovar.
			if (!isAuthenticated) {
				logout();
				return Promise.reject(error);
			}

			const authHeader = originalRequest.headers?.Authorization;
			const tokenFallido =
				typeof authHeader === "string" && authHeader.startsWith("Bearer ")
					? authHeader.slice(7)
					: useAuthStore.getState().accessToken;

			try {
				const newAccessToken = await refreshAccessToken(tokenFallido);

				if (originalRequest.headers) {
					originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
				}

				return apiClient(originalRequest);
			} catch (refreshError) {
				// Solo cerrar sesión si el servidor rechazó el refresh token.
				// Fallos de red o 5xx temporales (p.ej. un despliegue) no deben expulsar al usuario.
				if (esRechazoDeSesion(refreshError)) {
					logout();
				}
				return Promise.reject(refreshError);
			}
		}

		return Promise.reject(error);
	},
);

export function getErrorMessage(error: unknown): string {
	if (isAxiosError<ErrorResponse>(error)) {
		if (error.response?.data?.error) {
			return error.response.data.error;
		}
		if (error.message) {
			return error.message;
		}
	}
	if (error instanceof Error) {
		return error.message;
	}
	return "Ha ocurrido un error inesperado";
}
