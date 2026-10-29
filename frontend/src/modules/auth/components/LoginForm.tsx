import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { getErrorMessage } from "@/core/api/client";
import { useAuthStore } from "@/core/auth/store";
import { useAppForm } from "@/core/components/form/useAppForm";
import { Button } from "@/core/components/ui/Button";
import { authApi } from "../api/authApi";
import { type LoginInput, loginSchema } from "../schemas/authSchemas";

export function LoginForm() {
	const navigate = useNavigate();
	const login = useAuthStore((state) => state.login);

	const form = useAppForm({
		defaultValues: { email: "", password: "" } as LoginInput,
		validators: { onChange: loginSchema },
		onSubmit: async ({ value }) => {
			try {
				const response = await authApi.login(value);
				login(response);
				toast.success(`¡Bienvenido de nuevo, ${response.usuario.nombre}!`);
				navigate({ to: "/" });
			} catch (error: unknown) {
				toast.error(getErrorMessage(error));
			}
		},
	});

	const rellenarDemoAdmin = () => {
		form.setFieldValue("email", "admin@dev.com");
		form.setFieldValue("password", "SecurePass123!");
	};

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
