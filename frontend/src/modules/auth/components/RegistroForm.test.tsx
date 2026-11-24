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

const { registroMock, toastMock, navigateMock, historyPushMock } = vi.hoisted(
	() => ({
		registroMock: vi.fn(),
		toastMock: { success: vi.fn(), error: vi.fn() },
		navigateMock: vi.fn(),
		historyPushMock: vi.fn(),
	}),
);

vi.mock("../api/authApi", () => ({
	authApi: { registro: registroMock },
}));
vi.mock("sonner", () => ({ toast: toastMock }));
vi.mock("@tanstack/react-router", () => ({
	useNavigate: () => navigateMock,
	useRouter: () => ({ history: { push: historyPushMock } }),
}));
vi.mock("@/core/router", () => ({ queryClient: { clear: vi.fn() } }));

import { RegistroForm } from "./RegistroForm";

const sesionCreada = {
	accessToken: "jwt-nuevo-123",
	usuario: {
		id: 10,
		nombre: "Juan Pérez",
		email: "juan@ejemplo.com",
		isActivo: true,
		roles: ["USUARIO"],
		emailVerificado: false,
		avatarUrl: null,
	},
};

describe("RegistroForm", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		useAuthStore.setState({
			usuario: null,
			accessToken: null,
			isAuthenticated: false,
		});
	});

	afterEach(() => cleanup());

	it("rechaza contraseña débil y nombre corto sin llamar a la API", async () => {
		render(<RegistroForm />);

		fireEvent.change(screen.getByLabelText("Nombre completo"), {
			target: { value: "J" },
		});
		fireEvent.change(screen.getByLabelText("Correo electrónico"), {
			target: { value: "juan@ejemplo.com" },
		});
		fireEvent.change(screen.getByLabelText("Contraseña"), {
			target: { value: "corta" },
		});
		fireEvent.click(screen.getByRole("button", { name: "Crear Cuenta" }));

		await waitFor(() => {
			expect(
				screen.getByText("El nombre debe tener al menos 2 caracteres"),
			).toBeTruthy();
			expect(
				screen.getByText("La contraseña debe tener al menos 12 caracteres"),
			).toBeTruthy();
		});
		expect(registroMock).not.toHaveBeenCalled();
	});

	it("crea la cuenta, guarda la sesión y navega a /", async () => {
		registroMock.mockResolvedValue(sesionCreada);
		render(<RegistroForm />);

		fireEvent.change(screen.getByLabelText("Nombre completo"), {
			target: { value: "Juan Pérez" },
		});
		fireEvent.change(screen.getByLabelText("Correo electrónico"), {
			target: { value: "juan@ejemplo.com" },
		});
		fireEvent.change(screen.getByLabelText("Contraseña"), {
			target: { value: "SecurePass123!" },
		});
		fireEvent.click(screen.getByRole("button", { name: "Crear Cuenta" }));

		await waitFor(() => {
			expect(registroMock).toHaveBeenCalledWith({
				nombre: "Juan Pérez",
				email: "juan@ejemplo.com",
				password: "SecurePass123!",
			});
		});

		expect(useAuthStore.getState()).toMatchObject({
			accessToken: "jwt-nuevo-123",
			isAuthenticated: true,
		});
		expect(toastMock.success).toHaveBeenCalledWith(
			"¡Cuenta creada con éxito! Bienvenido, Juan Pérez",
		);
		expect(navigateMock).toHaveBeenCalledWith({ to: "/" });
	});

	it("redirige a destino si se pasa la prop destino", async () => {
		registroMock.mockResolvedValue(sesionCreada);
		render(<RegistroForm destino="/organizaciones" />);

		fireEvent.change(screen.getByLabelText("Nombre completo"), {
			target: { value: "Juan Pérez" },
		});
		fireEvent.change(screen.getByLabelText("Correo electrónico"), {
			target: { value: "juan@ejemplo.com" },
		});
		fireEvent.change(screen.getByLabelText("Contraseña"), {
			target: { value: "SecurePass123!" },
		});
		fireEvent.click(screen.getByRole("button", { name: "Crear Cuenta" }));

		await waitFor(() => {
			expect(historyPushMock).toHaveBeenCalledWith("/organizaciones");
		});
	});

	it("muestra toast.error si authApi.registro falla", async () => {
		registroMock.mockRejectedValue(new Error("El correo ya está registrado"));
		render(<RegistroForm />);

		fireEvent.change(screen.getByLabelText("Nombre completo"), {
			target: { value: "Juan Pérez" },
		});
		fireEvent.change(screen.getByLabelText("Correo electrónico"), {
			target: { value: "juan@ejemplo.com" },
		});
		fireEvent.change(screen.getByLabelText("Contraseña"), {
			target: { value: "SecurePass123!" },
		});
		fireEvent.click(screen.getByRole("button", { name: "Crear Cuenta" }));

		await waitFor(() => {
			expect(toastMock.error).toHaveBeenCalledWith(
				"El correo ya está registrado",
			);
		});
	});
});
