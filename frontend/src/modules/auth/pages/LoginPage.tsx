import { Link } from "@tanstack/react-router";
import { AuthLayout } from "@/core/components/layout/AuthLayout";
import { BotonGoogle } from "../components/BotonGoogle";
import { LoginForm } from "../components/LoginForm";
import { SeparadorO } from "../components/SeparadorO";

export function LoginPage({ errorGoogle }: { errorGoogle: boolean }) {
	return (
		<AuthLayout
			title="Iniciar Sesión"
			subtitle="Ingresa tus credenciales para acceder a Cosmoflow"
		>
			{errorGoogle && (
				<p
					role="alert"
					className="mb-4 rounded-lg border border-rose-900/50 bg-rose-950/40 px-3 py-2 text-sm text-rose-300"
				>
					No se pudo iniciar sesión con Google. Inténtalo de nuevo o usa tu
					email y contraseña.
				</p>
			)}
			<BotonGoogle />
			<SeparadorO />
			<LoginForm />
			<div className="mt-4 text-right text-xs">
				<Link
					to="/recuperar-password"
					className="font-medium text-indigo-400 hover:text-indigo-300 hover:underline"
				>
					¿Olvidaste tu contraseña?
				</Link>
			</div>
			<div className="mt-6 text-center text-xs text-tinta-tenue">
				¿No tienes una cuenta?{" "}
				<Link
					to="/registro"
					className="font-medium text-indigo-400 hover:text-indigo-300 hover:underline"
				>
					Regístrate aquí
				</Link>
			</div>
		</AuthLayout>
	);
}
