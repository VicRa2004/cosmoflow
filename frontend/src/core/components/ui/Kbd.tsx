import { cn } from "@/core/utils/cn";

const MOD = /Mac|iPhone|iPad/.test(navigator.userAgent) ? "⌘" : "Ctrl";

/** Atajo `Ctrl+<tecla>` (⌘ en Mac). Oculto en móvil, donde no hay teclado. */
export function Kbd({
	tecla,
	className,
}: {
	tecla: string;
	className?: string;
}) {
	return (
		<kbd
			className={cn(
				"hidden h-5 items-center rounded border border-borde bg-elevada px-1.5 font-sans text-[11px] font-medium text-tinta-tenue sm:inline-flex",
				className,
			)}
		>
			{MOD} {tecla}
		</kbd>
	);
}
