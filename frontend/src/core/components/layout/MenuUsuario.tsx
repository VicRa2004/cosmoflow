import { Link, useNavigate } from "@tanstack/react-router";
import { LogOut, UserRound } from "lucide-react";
import { useRef } from "react";
import { toast } from "sonner";
import { useAuthStore } from "@/core/auth/store";
import { Avatar } from "@/core/components/ui/Avatar";
import { authApi } from "@/modules/auth/api/authApi";

const ID = "menu-usuario";
const opcion =
	"flex h-8 w-full items-center gap-2.5 rounded-md px-2 text-sm text-tinta-suave transition-colors hover:bg-elevada hover:text-tinta";

/** Avatar del navbar con su menú (popover nativo: Esc y clic fuera lo cierran). */
export function MenuUsuario() {
	const navigate = useNavigate();
	const { usuario, logout } = useAuthStore();
	const menu = useRef<HTMLDivElement>(null);
	const cerrar = () => menu.current?.hidePopover();

	const handleLogout = async () => {
		cerrar();
		try {
			await authApi.logout();
		} catch {
			// Ignoramos error en logout para asegurar limpieza local
		} finally {
			logout();
			toast.info("Sesión cerrada correctamente");
			navigate({ to: "/login" });
		}
	};

	if (!usuario) return null;

	return (
		<>
			<button
				type="button"
				popoverTarget={ID}
				aria-label={`Cuenta de ${usuario.nombre}`}
				className="rounded-full transition-opacity hover:opacity-85"
			>
				<Avatar nombre={usuario.nombre} url={usuario.avatarUrl} />
			</button>
			<div
				ref={menu}
				id={ID}
				popover="auto"
				className="inset-auto top-13 right-3 m-0 w-64 rounded-lg border border-borde bg-superficie p-1.5 text-tinta shadow-flotante"
			>
				<div className="flex items-center gap-2.5 px-2 pt-1.5 pb-2.5">
					<Avatar nombre={usuario.nombre} url={usuario.avatarUrl} />
					<div className="min-w-0">
						<p className="truncate text-sm font-medium">{usuario.nombre}</p>
						<p className="truncate text-xs text-tinta-tenue">{usuario.email}</p>
					</div>
				</div>
				<p className="px-2 pb-2 text-xs text-tinta-tenue">
					Rol:{" "}
					<span className="text-tinta-suave">{usuario.roles.join(", ")}</span>
				</p>
				<hr className="-mx-1.5 my-1 border-borde" />
				<Link to="/perfil" onClick={cerrar} className={opcion}>
					<UserRound aria-hidden className="size-4 text-tinta-tenue" />
					Mi perfil
				</Link>
				<button type="button" onClick={handleLogout} className={opcion}>
					<LogOut aria-hidden className="size-4 text-tinta-tenue" />
					Cerrar sesión
				</button>
			</div>
		</>
	);
}
