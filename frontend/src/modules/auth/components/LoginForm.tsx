import { useState } from "react";
import { useNavigate, useRouter } from "@tanstack/react-router";
import { toast } from "sonner";
import { getErrorMessage } from "@/core/api/client";
import { useAuthStore } from "@/core/auth/store";
import { useAppForm } from "@/core/components/form/useAppForm";
import { Button } from "@/core/components/ui/Button";
import { authApi } from "../api/authApi";
import type { AuthResponse } from "@/core/auth/types";
import { type LoginInput, loginSchema } from "../schemas/authSchemas";
import { CodigoDosPasosForm } from "./CodigoDosPasosForm";

/** `destino`: ruta interna a la que volver tras entrar; sin él, la portada. */
export function LoginForm({ destino }: { destino?: string }) {
	const navigate = useNavigate();
	const router = useRouter();
	const login = useAuthStore((state) => state.login);
	/** Contraseña correcta con 2FA activo: falta el código. */
	const [tokenDosPasos, setTokenDosPasos] = useState<string | null>(null);

	const entrar = (response: AuthResponse) => {
		login(response);
		toast.success(`¡Bienvenido de nuevo, ${response.usuario.nombre}!`);
		if (destino) router.history.push(destino);
		else navigate({ to: "/" });
	};

	const form = useAppForm({
		defaultValues: { email: "", password: "" } as LoginInput,
		validators: { onChange: loginSchema },
		onSubmit: async ({ value }) => {
			try {
				const response = await authApi.login(value);
				if ("requiereDosPasos" in response) {
					setTokenDosPasos(response.tokenDosPasos);
				} else entrar(response);
			} catch (error: unknown) {
				toast.error(getErrorMessage(error));
			}
		},
	});

	const rellenarDemoAdmin = () => {
		form.setFieldValue("email", "admin@dev.com");
		form.setFieldValue("password", "SecurePass123!");
	};

	if (tokenDosPasos) {
		return (
			<CodigoDosPasosForm
				tokenDosPasos={tokenDosPasos}
				onEntrar={entrar}
				onVolver={() => setTokenDosPasos(null)}
			/>
		);
	}

	return (
		<form.AppForm>
			<form.Formulario className="space-y-4">
				<form.AppField name="email">
					{(campo) => (
						<campo.CampoTexto
							label="Correo electrónico"
							type="email"
							placeholder="usuario@ejemplo.com"
							autoComplete="email"
						/>
					)}
				</form.AppField>
				<form.AppField name="password">
					{(campo) => (
						<campo.CampoTexto
							label="Contraseña"
							type="password"
							placeholder="••••••••••••"
							autoComplete="current-password"
						/>
					)}
				</form.AppField>

				<form.BotonEnviar className="w-full" size="lg">
					Iniciar sesión
				</form.BotonEnviar>

				{/* Solo en desarrollo: el seed demo crea este usuario. */}
				{import.meta.env.DEV && (
					<Button
						variant="ghost"
						size="sm"
						onClick={rellenarDemoAdmin}
						className="w-full text-tinta-tenue"
					>
						Rellenar con el admin de prueba
					</Button>
				)}
			</form.Formulario>
		</form.AppForm>
	);
}
