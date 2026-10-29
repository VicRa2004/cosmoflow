import { useRouterState } from "@tanstack/react-router";
import { ChevronRight, Menu } from "lucide-react";
import { Button } from "@/core/components/ui/Button";
import { MenuUsuario } from "./MenuUsuario";
import { NAVEGACION } from "./navegacion";
import { SelectorTema } from "./SelectorTema";

const FUERA_DEL_MENU: Record<string, string> = { "/perfil": "Mi perfil" };

/** Grupo y sección de la ruta actual, sacados del menú lateral. */
function useMigas() {
	const ruta = useRouterState({ select: (estado) => estado.location.pathname });
	for (const grupo of NAVEGACION) {
		const item = grupo.items.find(
			(i) => ruta === i.to || ruta.startsWith(`${i.to}/`),
		);
		if (item) return { grupo: grupo.titulo, seccion: item.etiqueta };
	}
	return { grupo: undefined, seccion: FUERA_DEL_MENU[ruta] };
}

export function Navbar({ onAbrirMenu }: { onAbrirMenu: () => void }) {
	const { grupo, seccion } = useMigas();

	return (
		<header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-3 border-b border-borde bg-fondo px-4 sm:px-6">
			<Button
				variant="ghost"
				size="sm"
				onClick={onAbrirMenu}
				aria-label="Abrir menú"
				className="-ml-1 w-8 px-0 md:hidden"
			>
				<Menu className="size-4" />
			</Button>
			<nav aria-label="Ubicación" className="min-w-0 flex-1">
				<ol className="flex items-center gap-1.5 text-sm">
					{grupo && (
						<li className="hidden items-center gap-1.5 text-tinta-tenue sm:flex">
							{grupo}
							<ChevronRight aria-hidden className="size-3.5" />
						</li>
					)}
					{seccion && (
						<li aria-current="page" className="truncate font-medium text-tinta">
							{seccion}
						</li>
					)}
				</ol>
			</nav>
			<SelectorTema />
			<MenuUsuario />
		</header>
	);
}
