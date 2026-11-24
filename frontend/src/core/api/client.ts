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

type MensajeAuth = { tipo: "token"; accessToken: string } | { tipo: "logout" };

const RUTAS_AUTH_SIN_REFRESH = new Set([
	"/auth/refresh",
	"/auth/login",
	"/auth/login/dos-pasos",
	"/auth/registro",
	"/auth/logout",
]);

function esRutaAuthSinRefresh(url?: string): boolean {
	if (!url) return false;
	const ruta = url.split("?")[0] ?? "";
	const normalizada = ruta.startsWith("/") ? ruta : `/${ruta}`;
	const sinPrefijoApi = normalizada.replace(/^\/api(?=\/)/, "");
	return (
		RUTAS_AUTH_SIN_REFRESH.has(normalizada) ||
		RUTAS_AUTH_SIN_REFRESH.has(sinPrefijoApi)
	);
}

function extraerTokenFallido(
	headers: CustomAxiosRequestConfig["headers"],
): string | null {
	if (!headers) return null;
	const raw =
		typeof headers.get === "function"
			? headers.get("Authorization")
			: (headers as Record<string, unknown>).Authorization;
	if (typeof raw !== "string") return null;
	return raw.startsWith("Bearer ") ? raw.slice(7) : null;
}

const canalAuth =
	typeof BroadcastChannel !== "undefined"
		? new BroadcastChannel("cosmoflow-auth")
		: null;

if (canalAuth) {
	canalAuth.onmessage = (evento: MessageEvent<MensajeAuth>) => {
		const mensaje = evento.data;
		if (!mensaje || typeof mensaje !== "object") return;
		if (mensaje.tipo === "token" && typeof mensaje.accessToken === "string") {
			useAuthStore.getState().setTokens({ accessToken: mensaje.accessToken });
		} else if (mensaje.tipo === "logout") {
			useAuthStore.getState().logout();
		}
	};
}

function emitirAuth(mensaje: MensajeAuth): void {
	try {
		canalAuth?.postMessage(mensaje);
	} catch {
		// Ignorar si el canal fue cerrado en entorno de pruebas o salida de página.
	}
}

async function conBloqueoRefresh<T>(fn: () => Promise<T>): Promise<T> {
	if (typeof navigator !== "undefined" && navigator.locks) {
		return navigator.locks.request("cosmoflow-auth-refresh", fn);
	}
	return fn();
}

export const apiClient = axios.create({
	baseURL: "/api",
	headers: {
		"Content-Type": "application/json",
	},
});

// Una sola renovación en vuelo por pestaña y coordinada entre pestañas:
// el backend rota el refresh token, así que peticiones 401 simultáneas
// que reenvíen el mismo token revocado invalidarían todas las sesiones.
let refreshPromise: Promise<string> | null = null;

function refreshAccessToken(tokenFallido: string | null): Promise<string> {
	refreshPromise ??= conBloqueoRefresh(async () => {
		// Rehidrata desde localStorage por si otra pestaña ya renovó mientras esperábamos el lock.
		await useAuthStore.persist?.rehydrate();
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
		emitirAuth({ tipo: "token", accessToken: data.accessToken });
		return data.accessToken;
	}).finally(() => {
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

		if (
			error.response?.status === 401 &&
			!originalRequest._retry &&
			!esRutaAuthSinRefresh(originalRequest.url)
		) {
			originalRequest._retry = true;
			const { isAuthenticated, logout } = useAuthStore.getState();

			// Sin sesión (p.ej. credenciales inválidas en el login) no hay qué renovar.
			if (!isAuthenticated) {
				logout();
				return Promise.reject(error);
			}

			try {
				const tokenFallido = extraerTokenFallido(originalRequest.headers);
				const newAccessToken = await refreshAccessToken(tokenFallido);

				if (originalRequest.headers) {
					originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
				}

				return apiClient(originalRequest);
			} catch (refreshError) {
				// Solo cerrar sesión si el servidor rechaza el refresh token;
				// fallos de red o 5xx temporales conservan la sesión local.
				if (esRechazoDeSesion(refreshError)) {
					logout();
					emitirAuth({ tipo: "logout" });
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
