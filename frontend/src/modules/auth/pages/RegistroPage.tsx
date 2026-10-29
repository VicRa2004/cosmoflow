import { Link } from "@tanstack/react-router";
import { AuthLayout } from "@/core/components/layout/AuthLayout";
import { BotonGoogle } from "../components/BotonGoogle";
import { RegistroForm } from "../components/RegistroForm";
import { SeparadorO } from "../components/SeparadorO";

export function RegistroPage({ destino }: { destino?: string }) {
	return (
		<AuthLayout
			title="Crea tu cuenta"
			subtitle="Empieza a organizar tus tareas y notas."
		>
			<BotonGoogle />
			<SeparadorO />
			<RegistroForm destino={destino} />
			<div className="mt-6 text-center text-xs text-tinta-tenue">
				¿Ya tienes una cuenta?{" "}
				<Link
					to="/login"
					search={{ redirect: destino }}
					className="font-medium text-indigo-400 hover:text-indigo-300 hover:underline"
				>
					Inicia sesión
				</Link>
			</div>
		</AuthLayout>
	);
}
