import { Menu, Search } from "lucide-react";
import { Button } from "@/core/components/ui/Button";
import { Kbd } from "@/core/components/ui/Kbd";
import { MenuUsuario } from "./MenuUsuario";
import { SelectorTema } from "./SelectorTema";

export function Navbar({
	onAbrirMenu,
	onAbrirPaleta,
}: {
	onAbrirMenu: () => void;
	onAbrirPaleta: () => void;
}) {
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
			<div className="flex-1" />
			<Button
				variant="ghost"
				size="sm"
				onClick={onAbrirPaleta}
				aria-label="Ir a… (Ctrl+K)"
				className="text-tinta-tenue"
			>
				<Search className="size-4" />
				<span className="hidden sm:inline">Ir a…</span>
				<Kbd tecla="K" />
			</Button>
			<SelectorTema />
			<MenuUsuario />
		</header>
	);
}
