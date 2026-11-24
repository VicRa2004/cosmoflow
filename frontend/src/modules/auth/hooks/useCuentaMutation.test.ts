// @vitest-environment happy-dom
import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useAuthStore } from "@/core/auth/store";
import { crearWrapperQuery } from "@/test/renderConQuery";

const { mocksAuth, mocksToast, navigateMock } = vi.hoisted(() => ({
	mocksAuth: {
		recuperarPassword: vi.fn(),
		restablecerPassword: vi.fn(),
		verificarEmail: vi.fn(),
		reenviarVerificacion: vi.fn(),
		cambiarPassword: vi.fn(),
		cerrarSesiones: vi.fn(),
	},
	mocksToast: {
		success: vi.fn(),
		error: vi.fn(),
	},
	navigateMock: vi.fn(),
}));

vi.mock("../api/authApi", () => ({ authApi: mocksAuth }));
vi.mock("sonner", () => ({ toast: mocksToast }));
vi.mock("@tanstack/react-router", () => ({
	useNavigate: () => navigateMock,
}));
vi.mock("@/core/router", () => ({ queryClient: { clear: vi.fn() } }));

import {
	useCambiarPasswordMutation,
	useCerrarSesionesMutation,
	useRecuperarPasswordMutation,
	useReenviarVerificacionMutation,
	useRestablecerPasswordMutation,
	useVerificarEmailMutation,
} from "./useCuentaMutation";

const usuarioBase = {
	id: 1,
	nombre: "Ana",
	email: "ana@ejemplo.com",
	isActivo: true,
	roles: ["USUARIO"],
	emailVerificado: false,
	avatarUrl: null,
};

describe("hooks de mutación de cuenta (auth)", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		useAuthStore.setState({
			usuario: null,
			accessToken: null,
			isAuthenticated: false,
		});
	});

	it("useRestablecerPasswordMutation notifica éxito y navega a /login", async () => {
		mocksAuth.restablecerPassword.mockResolvedValue({
			mensaje: "Contraseña actualizada",
		});

		const { result } = renderHook(() => useRestablecerPasswordMutation(), {
			wrapper: crearWrapperQuery(),
		});

		await result.current.mutateAsync({
			token: "tok-123",
			password: "NuevaPassword1!",
		});

		expect(mocksAuth.restablecerPassword).toHaveBeenCalledWith(
			{ token: "tok-123", password: "NuevaPassword1!" },
			expect.anything(),
		);
		expect(mocksToast.success).toHaveBeenCalledWith("Contraseña actualizada");
		expect(navigateMock).toHaveBeenCalledWith({ to: "/login" });
	});

	it("useVerificarEmailMutation marca emailVerificado si hay sesión activa", async () => {
		useAuthStore.getState().login({
			accessToken: "token-inicial",
			usuario: usuarioBase,
		});
		mocksAuth.verificarEmail.mockResolvedValue({ mensaje: "Verificado" });

		const { result } = renderHook(() => useVerificarEmailMutation(), {
			wrapper: crearWrapperQuery(),
		});

		await result.current.mutateAsync("token-email");

		expect(mocksAuth.verificarEmail).toHaveBeenCalledWith(
			"token-email",
			expect.anything(),
		);
		expect(useAuthStore.getState().usuario?.emailVerificado).toBe(true);
	});

	it("useVerificarEmailMutation no falla si no hay sesión iniciada", async () => {
		mocksAuth.verificarEmail.mockResolvedValue({ mensaje: "Verificado" });

		const { result } = renderHook(() => useVerificarEmailMutation(), {
			wrapper: crearWrapperQuery(),
		});

		await result.current.mutateAsync("token-email");

		expect(useAuthStore.getState().usuario).toBeNull();
		expect(useAuthStore.getState().isAuthenticated).toBe(false);
	});

	it("useCambiarPasswordMutation actualiza el accessToken y muestra confirmación", async () => {
		useAuthStore.getState().login({
			accessToken: "token-viejo",
			usuario: usuarioBase,
		});
		mocksAuth.cambiarPassword.mockResolvedValue({
			accessToken: "token-nuevo",
		});

		const { result } = renderHook(() => useCambiarPasswordMutation(), {
			wrapper: crearWrapperQuery(),
		});

		await result.current.mutateAsync({
			passwordActual: "ViejaPassword1!",
			passwordNueva: "NuevaPassword1!",
		});

		expect(useAuthStore.getState().accessToken).toBe("token-nuevo");
		expect(mocksToast.success).toHaveBeenCalledWith(
			"Contraseña cambiada. Se cerraron tus otras sesiones.",
		);
	});

	it("useCerrarSesionesMutation limpia la sesión, notifica y redirige a /login", async () => {
		useAuthStore.getState().login({
			accessToken: "token-activo",
			usuario: usuarioBase,
		});
		mocksAuth.cerrarSesiones.mockResolvedValue({
			mensaje: "Sesiones cerradas",
		});

		const { result } = renderHook(() => useCerrarSesionesMutation(), {
			wrapper: crearWrapperQuery(),
		});

		await result.current.mutateAsync();

		expect(useAuthStore.getState().isAuthenticated).toBe(false);
		expect(useAuthStore.getState().accessToken).toBeNull();
		expect(mocksToast.success).toHaveBeenCalledWith("Sesiones cerradas");
		expect(navigateMock).toHaveBeenCalledWith({ to: "/login" });
	});

	it("muestra toast.error cuando la API falla en recuperar o reenviar", async () => {
		mocksAuth.recuperarPassword.mockRejectedValue(
			new Error("Servicio no disponible"),
		);
		mocksAuth.reenviarVerificacion.mockRejectedValue(
			new Error("Demasiados intentos"),
		);

		const recuperar = renderHook(() => useRecuperarPasswordMutation(), {
			wrapper: crearWrapperQuery(),
		});
		const reenviar = renderHook(() => useReenviarVerificacionMutation(), {
			wrapper: crearWrapperQuery(),
		});

		recuperar.result.current.mutate("ana@ejemplo.com");
		await waitFor(() =>
			expect(mocksToast.error).toHaveBeenCalledWith("Servicio no disponible"),
		);

		reenviar.result.current.mutate();
		await waitFor(() =>
			expect(mocksToast.error).toHaveBeenCalledWith("Demasiados intentos"),
		);
	});
});
