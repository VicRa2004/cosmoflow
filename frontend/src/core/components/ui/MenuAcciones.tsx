import { type LucideIcon, MoreHorizontal } from "lucide-react";
import { type ToggleEvent, useId, useRef } from "react";
import { cn } from "@/core/utils/cn";
import { Button } from "./Button";
import { ajustarAPantalla, colocarBajo } from "./popoverAnclado";

export interface AccionMenu {
	etiqueta: string;
	icono: LucideIcon;
	onClick: () => void;
	/** Borrados: al final, separada y en rojo. */
	peligrosa?: boolean;
}

interface MenuAccionesProps {
	/** `false` para las que el usuario no puede usar (`puede(...) && {...}`). */
	acciones: (AccionMenu | false)[];
	etiqueta?: string;
}

/** Botón «⋯» con las acciones secundarias de una página (popover nativo). */
export function MenuAcciones({
	acciones,
	etiqueta = "Más acciones",
}: MenuAccionesProps) {
	const id = useId();
	const boton = useRef<HTMLButtonElement>(null);
	const menu = useRef<HTMLDivElement>(null);
	const visibles = acciones.filter((a) => a !== false);
	if (visibles.length === 0) return null;
	const normales = visibles.filter((a) => !a.peligrosa);
	const peligrosas = visibles.filter((a) => a.peligrosa);

	const item = (accion: AccionMenu) => (
		<button
			key={accion.etiqueta}
			type="button"
			onClick={() => {
				menu.current?.hidePopover();
				accion.onClick();
			}}
			className={cn(
				"flex h-9 w-full cursor-pointer items-center gap-2.5 rounded-md px-2 text-left text-sm",
				accion.peligrosa
					? "text-rose-400 hover:bg-rose-950 hover:text-rose-300"
					: "text-tinta-suave hover:bg-elevada hover:text-tinta",
			)}
		>
			<accion.icono aria-hidden className="size-4 shrink-0" />
			{accion.etiqueta}
		</button>
	);

	return (
		<>
			<Button
				ref={boton}
				variant="ghost"
				size="sm"
				popoverTarget={id}
				aria-label={etiqueta}
				title={etiqueta}
			>
				<MoreHorizontal className="h-4 w-4" />
			</Button>
			<div
				ref={menu}
				id={id}
				popover="auto"
				onBeforeToggle={(e: ToggleEvent<HTMLDivElement>) => {
					if (e.newState === "open" && boton.current)
						colocarBajo(e.currentTarget, boton.current, "fin");
				}}
				onToggle={(e: ToggleEvent<HTMLDivElement>) => {
					if (e.newState === "open" && boton.current)
						ajustarAPantalla(e.currentTarget, boton.current);
				}}
				className="inset-auto m-0 w-60 rounded-lg border border-borde bg-superficie p-1.5 text-tinta shadow-flotante"
			>
				{normales.map(item)}
				{peligrosas.length > 0 && normales.length > 0 && (
					<hr className="my-1.5 border-borde" />
				)}
				{peligrosas.map(item)}
			</div>
		</>
	);
}
