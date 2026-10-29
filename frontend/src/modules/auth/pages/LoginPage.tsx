import { Link } from "@tanstack/react-router";
import { AuthLayout } from "@/core/components/layout/AuthLayout";
import { BotonGoogle } from "../components/BotonGoogle";
import { LoginForm } from "../components/LoginForm";
import { SeparadorO } from "../components/SeparadorO";

export function LoginPage({
	errorGoogle,
	destino,
}: {
	errorGoogle: boolean;
	/** Ruta interna a la que volver tras entrar. */
	destino?: string;
}) {
	return (
		<AuthLayout
			title="Inicia sesión"
			subtitle="Bienvenido de nuevo. Entra para ver tus pendientes."
		>
			{errorGoogle && (
				<p
					role="alert"
					className="mb-4 rounded-md border border-rose-800 bg-rose-950 px-3 py-2 text-sm text-rose-300"
				>
					No se pudo iniciar sesión con Google. Inténtalo de nuevo o usa tu
					email y contraseña.
				</p>
			)}
			<BotonGoogle />
			<SeparadorO />
			<LoginForm destino={destino} />
			<div className="mt-3 text-right text-[13px]">
				<Link
					to="/recuperar-password"
					className="font-medium text-indigo-400 hover:text-indigo-300 hover:underline"
				>
					¿Olvidaste tu contraseña?
				</Link>
			</div>
			<div className="mt-8 text-center text-sm text-tinta-tenue">
				¿No tienes una cuenta?{" "}
				<Link
					to="/registro"
					search={{ redirect: destino }}
					className="font-medium text-indigo-400 hover:text-indigo-300 hover:underline"
				>
					Regístrate aquí
				</Link>
			</div>
		</AuthLayout>
	);
}
