import { PerfilUsuarioCard } from "../components/PerfilUsuarioCard";
import { CambiarPasswordForm } from "@/modules/auth/components/CambiarPasswordForm";
import { SeguridadCuentaCard } from "@/modules/auth/components/SeguridadCuentaCard";
import { EncabezadoPagina } from "@/core/components/ui/EncabezadoPagina";

export function PerfilPage() {
	return (
		<div className="max-w-2xl space-y-6">
			<EncabezadoPagina
				titulo="Mi perfil"
				descripcion="Información de la cuenta y detalles de la sesión activa."
			/>

			<PerfilUsuarioCard />
			<SeguridadCuentaCard />
			<CambiarPasswordForm />
		</div>
	);
}
