import { cn } from "@/core/utils/cn";

/** Colores de acento que se ofrecen para destacar tags, tareas, notas y proyectos. */
export const COLORES_ACENTO = [
	{ valor: "#ef4444", nombre: "Rojo" },
	{ valor: "#f59e0b", nombre: "Ámbar" },
	{ valor: "#10b981", nombre: "Verde" },
	{ valor: "#0ea5e9", nombre: "Azul" },
	{ valor: "#6366f1", nombre: "Índigo" },
	{ valor: "#d946ef", nombre: "Fucsia" },
] as const;

/** Punto con el color de acento; sin color no pinta nada. */
export function PuntoColor({
	color,
	className,
}: {
	color?: string | null;
	className?: string;
}) {
	if (!color) return null;
	return (
		<span
			aria-hidden
			className={cn(
				"inline-block h-2.5 w-2.5 shrink-0 rounded-full",
				className,
			)}
			style={{ backgroundColor: color }}
		/>
	);
}
