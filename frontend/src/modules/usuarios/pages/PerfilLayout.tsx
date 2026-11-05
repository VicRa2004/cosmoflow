import { Link, Outlet } from "@tanstack/react-router";
import { EncabezadoPagina } from "@/core/components/ui/EncabezadoPagina";
import { Pestanas, pestanaProps } from "@/core/components/ui/Pestanas";

const SECCIONES = [
	{ to: "/perfil/general", etiqueta: "General" },
	{ to: "/perfil/notificaciones", etiqueta: "Notificaciones" },
	{ to: "/perfil/seguridad", etiqueta: "Seguridad" },
	{ to: "/perfil/conexiones", etiqueta: "Conexiones" },
] as const;

/** Cabecera y pestañas del perfil; cada sección es su propia página. */
export function PerfilLayout() {
	return (
		<div className="max-w-2xl space-y-6">
			<EncabezadoPagina
				titulo="Mi perfil"
				descripcion="Tu cuenta, cómo te avisamos y cómo accedes."
			/>
			<Pestanas etiqueta="Secciones del perfil">
				{SECCIONES.map(({ to, etiqueta }) => (
					<Link key={to} to={to} {...pestanaProps}>
						{etiqueta}
					</Link>
				))}
			</Pestanas>
			<Outlet />
		</div>
	);
}
