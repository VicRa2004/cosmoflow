import { cn } from "@/core/utils/cn";

/** Colores de acento que se ofrecen para destacar tags, tareas, notas y proyectos. */
export const COLORES_ACENTO = [
	{ valor: "#ef4444", nombre: "Rojo" },
	{ valor: "#f97316", nombre: "Naranja" },
	{ valor: "#f59e0b", nombre: "Ámbar" },
	{ valor: "#eab308", nombre: "Amarillo" },
	{ valor: "#84cc16", nombre: "Lima" },
	{ valor: "#10b981", nombre: "Verde" },
	{ valor: "#14b8a6", nombre: "Turquesa" },
	{ valor: "#06b6d4", nombre: "Cian" },
	{ valor: "#0ea5e9", nombre: "Azul" },
	{ valor: "#6366f1", nombre: "Índigo" },
	{ valor: "#8b5cf6", nombre: "Violeta" },
	{ valor: "#d946ef", nombre: "Fucsia" },
	{ valor: "#ec4899", nombre: "Rosa" },
	{ valor: "#78716c", nombre: "Piedra" },
	{ valor: "#64748b", nombre: "Pizarra" },
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
