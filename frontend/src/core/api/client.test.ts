import axios, {
	AxiosError,
	AxiosHeaders,
	type InternalAxiosRequestConfig,
} from "axios";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { clear, storageData } = vi.hoisted(() => {
	const data = new Map<string, string>();
	const storage = {
		getItem: (key: string) => data.get(key) ?? null,
		setItem: (key: string, value: string) => {
			data.set(key, value);
		},
		removeItem: (key: string) => {
			data.delete(key);
		},
		clear: () => {
			data.clear();
		},
		get length() {
			return data.size;
		},
		key: (index: number) => Array.from(data.keys())[index] ?? null,
	};
	vi.stubGlobal("localStorage", storage);
	vi.stubGlobal("window", {
		localStorage: storage,
		addEventListener: () => {},
	});
	return { clear: vi.fn(), storageData: data };
});

vi.mock("@/core/router", () => ({ queryClient: { clear } }));

import { useAuthStore } from "@/core/auth/store";
import { apiClient } from "./client";

const usuario = { id: 1, nombre: "Ana", email: "a@x.com", roles: ["USUARIO"] };

function errorHttp(
	status: number | undefined,
	config: InternalAxiosRequestConfig,
): AxiosError {
	const respuesta =
		status === undefined
			? undefined
			: {
					status,
					statusText: String(status),
					headers: {},
					config,
					data: { error: "Error" },
				};
	return new AxiosError(
		status === undefined ? "Network Error" : `Error ${status}`,
		status === undefined ? "ERR_NETWORK" : "ERR_BAD_REQUEST",
		config,
		null,
		respuesta,
	);
}

describe("apiClient (renovación de sesión)", () => {
	beforeEach(() => {
		vi.restoreAllMocks();
		clear.mockClear();
		storageData.clear();
		useAuthStore.getState().login({
			accessToken: "token-viejo",
			usuario,
		} as never);
	});

	it("no cierra sesión si /api/auth/refresh falla por error de red", async () => {
		apiClient.defaults.adapter = vi.fn(async (config) => {
			throw errorHttp(401, config);
		});
		vi.spyOn(axios, "post").mockRejectedValueOnce(
			errorHttp(undefined, {
				headers: new AxiosHeaders(),
			} as InternalAxiosRequestConfig),
		);

		await expect(apiClient.get("/tareas")).rejects.toThrow();

		expect(useAuthStore.getState()).toMatchObject({
			isAuthenticated: true,
			accessToken: "token-viejo",
		});
	});

	it("no cierra sesión si /api/auth/refresh responde 503", async () => {
		apiClient.defaults.adapter = vi.fn(async (config) => {
			throw errorHttp(401, config);
		});
		vi.spyOn(axios, "post").mockRejectedValueOnce(
			errorHttp(503, {
				headers: new AxiosHeaders(),
			} as InternalAxiosRequestConfig),
		);

		await expect(apiClient.get("/tareas")).rejects.toThrow();

		expect(useAuthStore.getState()).toMatchObject({
			isAuthenticated: true,
			accessToken: "token-viejo",
		});
	});

	it("cierra sesión si /api/auth/refresh responde 401", async () => {
		apiClient.defaults.adapter = vi.fn(async (config) => {
			throw errorHttp(401, config);
		});
		vi.spyOn(axios, "post").mockRejectedValueOnce(
			errorHttp(401, {
				headers: new AxiosHeaders(),
			} as InternalAxiosRequestConfig),
		);

		await expect(apiClient.get("/tareas")).rejects.toThrow();

		expect(useAuthStore.getState()).toMatchObject({
			isAuthenticated: false,
			accessToken: null,
			usuario: null,
		});
		expect(clear).toHaveBeenCalledTimes(1);
	});

	it("reutiliza el token renovado por otra pestaña sin llamar a /api/auth/refresh", async () => {
		const postSpy = vi.spyOn(axios, "post");

		const adapter = vi.fn(async (config: InternalAxiosRequestConfig) => {
			if (config.headers.get("Authorization") === "Bearer token-viejo") {
				// Simula que otra pestaña renovó y persistió el token mientras la petición iba en vuelo.
				const guardado = JSON.parse(
					storageData.get("cosmoflow-auth-storage") ?? "{}",
				) as { state?: Record<string, unknown>; version?: number };
				storageData.set(
					"cosmoflow-auth-storage",
					JSON.stringify({
						...guardado,
						state: {
							...guardado.state,
							accessToken: "token-otra-pestana",
						},
					}),
				);
				throw errorHttp(401, config);
			}
			return {
				data: { ok: true },
				status: 200,
				statusText: "OK",
				headers: {},
				config,
			};
		});
		apiClient.defaults.adapter = adapter;

		const res = await apiClient.get("/tareas");

		expect(res.data).toEqual({ ok: true });
		expect(postSpy).not.toHaveBeenCalled();
		expect(adapter).toHaveBeenCalledTimes(2);
		expect(adapter.mock.calls[1]?.[0].headers.get("Authorization")).toBe(
			"Bearer token-otra-pestana",
		);
	});
});
