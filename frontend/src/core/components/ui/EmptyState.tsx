import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/core/utils/cn";

export interface EmptyStateProps {
	icono: LucideIcon;
	titulo: string;
	descripcion?: ReactNode;
	/** Botón o enlace para salir del vacío (p. ej. «Crear el primero»). */
	accion?: ReactNode;
	className?: string;
}

export function EmptyState({
	icono: Icono,
	titulo,
	descripcion,
	accion,
	className,
}: EmptyStateProps) {
	return (
		<div
			className={cn(
				"rounded-lg border border-dashed border-borde-fuerte px-6 py-14 text-center",
				className,
			)}
		>
			<Icono className="mx-auto h-8 w-8 text-tinta-tenue" aria-hidden />
			<h4 className="mt-3 text-sm font-semibold text-tinta">{titulo}</h4>
			{descripcion && (
				<p className="mx-auto mt-1 max-w-sm text-sm text-tinta-tenue">
					{descripcion}
				</p>
			)}
			{accion && <div className="mt-4 flex justify-center">{accion}</div>}
		</div>
	);
}
