import type { LucideIcon } from "lucide-react";
import { useEffect, useRef } from "react";
import { cn } from "@/core/utils/cn";

export interface OpcionMenu {
	texto: string;
	icono: LucideIcon;
	onClick: () => void;
	peligrosa?: boolean;
}

export interface MenuAbierto {
	x: number;
	y: number;
	opciones: OpcionMenu[];
}

/** Menú de clic derecho: se cierra al elegir, al pulsar fuera, con Esc o al desplazar. */
export function MenuContextual({
	menu,
	onCerrar,
}: {
	menu?: MenuAbierto;
	onCerrar: () => void;
}) {
	const ref = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (!menu) return;
		ref.current?.querySelector("button")?.focus();
		const fuera = (e: Event) =>
			!ref.current?.contains(e.target as Node) && onCerrar();
		const tecla = (e: KeyboardEvent) => {
			if (e.key === "Escape") onCerrar();
			if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
			e.preventDefault();
			const botones = [...(ref.current?.querySelectorAll("button") ?? [])];
			const i = botones.indexOf(document.activeElement as HTMLButtonElement);
			const paso = e.key === "ArrowDown" ? 1 : -1;
			botones.at((i + paso) % botones.length)?.focus();
		};
		window.addEventListener("pointerdown", fuera);
		window.addEventListener("keydown", tecla);
		window.addEventListener("scroll", onCerrar, true);
		window.addEventListener("resize", onCerrar);
		return () => {
			window.removeEventListener("pointerdown", fuera);
			window.removeEventListener("keydown", tecla);
			window.removeEventListener("scroll", onCerrar, true);
			window.removeEventListener("resize", onCerrar);
		};
	}, [menu, onCerrar]);

	if (!menu) return null;
	// Que no se salga por la derecha ni por abajo.
	const x = Math.min(menu.x, window.innerWidth - 216);
	const y = Math.min(
		menu.y,
		window.innerHeight - menu.opciones.length * 32 - 16,
	);
	return (
		<div
			ref={ref}
			role="menu"
			className="fixed z-50 w-52 rounded-md border border-borde bg-superficie p-1 shadow-flotante"
			style={{ left: Math.max(8, x), top: Math.max(8, y) }}
		>
			{menu.opciones.map(({ texto, icono: Icono, onClick, peligrosa }) => (
				<button
					key={texto}
					type="button"
					role="menuitem"
					onClick={() => {
						onCerrar();
						onClick();
					}}
					className={cn(
						"flex h-8 w-full items-center gap-2 rounded px-2 text-left text-sm text-tinta-suave outline-none hover:bg-elevada focus-visible:bg-elevada",
						peligrosa && "text-rose-400",
					)}
				>
					<Icono aria-hidden className="h-3.5 w-3.5 shrink-0" />
					{texto}
				</button>
			))}
		</div>
	);
}
