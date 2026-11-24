// @vitest-environment happy-dom
import {
	cleanup,
	fireEvent,
	render,
	screen,
	waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useAuthStore } from "@/core/auth/store";

const { loginMock, toastMock, navigateMock, historyPushMock } = vi.hoisted(
	() => ({
		loginMock: vi.fn(),
		toastMock: { success: vi.fn(), error: vi.fn() },
		navigateMock: vi.fn(),
		historyPushMock: vi.fn(),
	}),
);

vi.mock("../api/authApi", () => ({
	authApi: { login: loginMock },
}));
vi.mock("sonner", () => ({ toast: toastMock }));
vi.mock("@tanstack/react-router", () => ({
	useNavigate: () => navigateMock,
	useRouter: () => ({ history: { push: historyPushMock } }),
}));
vi.mock("@/core/router", () => ({ queryClient: { clear: vi.fn() } }));

import { LoginForm } from "./LoginForm";

const sesionEjemplo = {
	accessToken: "jwt-access-123",
	usuario: {
		id: 7,
		nombre: "Ana López",
		email: "ana@ejemplo.com",
		isActivo: true,
		roles: ["USUARIO"],
		emailVerificado: true,
		avatarUrl: null,
	},
};

describe("LoginForm", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		useAuthStore.setState({
			usuario: null,
			accessToken: null,
			isAuthenticated: false,
		});
	});

	afterEach(() => cleanup());

	it("valida email inválido y contraseña vacía sin llamar a la API", async () => {
		render(<LoginForm />);

		fireEvent.change(screen.getByLabelText("Correo electrónico"), {
			target: { value: "correo-malo" },
		});
		fireEvent.click(screen.getByRole("button", { name: "Iniciar sesión" }));

		await waitFor(() => {
			expect(
				screen.getByText("Ingresa un correo electrónico válido"),
			).toBeTruthy();
		});
		expect(loginMock).not.toHaveBeenCalled();
	});

	it("guarda la sesión y navega a / cuando el login es válido", async () => {
		loginMock.mockResolvedValue(sesionEjemplo);
		render(<LoginForm />);

		fireEvent.change(screen.getByLabelText("Correo electrónico"), {
			target: { value: "ana@ejemplo.com" },
		});
		fireEvent.change(screen.getByLabelText("Contraseña"), {
			target: { value: "SecurePass123!" },
		});
		fireEvent.click(screen.getByRole("button", { name: "Iniciar sesión" }));

		await waitFor(() => {
			expect(loginMock).toHaveBeenCalledWith({
				email: "ana@ejemplo.com",
				password: "SecurePass123!",
			});
		});

		expect(useAuthStore.getState()).toMatchObject({
			accessToken: "jwt-access-123",
			isAuthenticated: true,
		});
		expect(toastMock.success).toHaveBeenCalledWith(
			"¡Bienvenido de nuevo, Ana López!",
		);
		expect(navigateMock).toHaveBeenCalledWith({ to: "/" });
	});

	it("redirige a destino con history.push cuando se proporciona", async () => {
		loginMock.mockResolvedValue(sesionEjemplo);
		render(<LoginForm destino="/tareas" />);

		fireEvent.change(screen.getByLabelText("Correo electrónico"), {
			target: { value: "ana@ejemplo.com" },
		});
		fireEvent.change(screen.getByLabelText("Contraseña"), {
			target: { value: "SecurePass123!" },
		});
		fireEvent.click(screen.getByRole("button", { name: "Iniciar sesión" }));

		await waitFor(() => {
			expect(historyPushMock).toHaveBeenCalledWith("/tareas");
		});
		expect(navigateMock).not.toHaveBeenCalled();
	});

	it("muestra el formulario de 2FA si requiereDosPasos es true", async () => {
		loginMock.mockResolvedValue({
			requiereDosPasos: true,
			tokenDosPasos: "token-2fa",
		});
		render(<LoginForm />);

		fireEvent.change(screen.getByLabelText("Correo electrónico"), {
			target: { value: "ana@ejemplo.com" },
		});
		fireEvent.change(screen.getByLabelText("Contraseña"), {
			target: { value: "SecurePass123!" },
		});
		fireEvent.click(screen.getByRole("button", { name: "Iniciar sesión" }));

		await waitFor(() => {
			expect(
				screen.getByText(
					"Escribe el código de 6 dígitos de tu app autenticadora.",
				),
			).toBeTruthy();
		});
		expect(useAuthStore.getState().isAuthenticated).toBe(false);
	});

	it("muestra toast.error si authApi.login falla", async () => {
		loginMock.mockRejectedValue(new Error("Credenciales inválidas"));
		render(<LoginForm />);

		fireEvent.change(screen.getByLabelText("Correo electrónico"), {
			target: { value: "ana@ejemplo.com" },
		});
		fireEvent.change(screen.getByLabelText("Contraseña"), {
			target: { value: "Incorrecta123!" },
		});
		fireEvent.click(screen.getByRole("button", { name: "Iniciar sesión" }));

		await waitFor(() => {
			expect(toastMock.error).toHaveBeenCalledWith("Credenciales inválidas");
		});
		expect(useAuthStore.getState().isAuthenticated).toBe(false);
	});
});
