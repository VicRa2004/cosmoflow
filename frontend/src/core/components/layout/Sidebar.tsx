import { Link } from "@tanstack/react-router";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { usePermisos } from "@/core/auth/usePermisos";
import { cn } from "@/core/utils/cn";
import { Marca } from "./Marca";
import { NAVEGACION } from "./navegacion";

interface SidebarProps {
	colapsado?: boolean;
	/** Sin él no se muestra el botón (el cajón móvil no se colapsa). */
	onAlternar?: () => void;
	/** Al elegir un enlace (cierra el cajón móvil). */
	onNavegar?: () => void;
}

/** Contenido del menú lateral: marca, grupos visibles según permisos y botón de colapsar. */
export function Sidebar({
	colapsado = false,
	onAlternar,
	onNavegar,
}: SidebarProps) {
	const { puede } = usePermisos();
	const grupos = NAVEGACION.map((grupo) => ({
		...grupo,
		items: grupo.items.filter((item) => puede(item.permiso)),
	})).filter((grupo) => grupo.items.length > 0);

	return (
		<div className="flex h-full flex-col bg-lateral [color-scheme:dark]">
			<Link
				to="/"
				onClick={onNavegar}
				className={cn(
					"flex h-14 shrink-0 items-center gap-2.5 px-4 text-[15px] font-semibold tracking-tight text-lateral-tinta",
					colapsado && "justify-center px-0",
				)}
			>
				<Marca />
				<span className={cn(colapsado && "sr-only")}>Cosmoflow</span>
			</Link>

			<nav aria-label="Principal" className="flex-1 overflow-y-auto px-3 pb-4">
				{grupos.map((grupo) => (
					<div key={grupo.titulo} className="mt-4 first:mt-1">
						{colapsado ? (
							<hr className="mx-2 mb-3 border-lateral-borde" />
						) : (
							<p className="px-2 pb-1.5 text-xs font-medium text-lateral-tenue">
								{grupo.titulo}
							</p>
						)}
						<ul className="space-y-0.5">
							{grupo.items.map(({ to, etiqueta, icono: Icono }) => (
								<li key={to}>
									<Link
										to={to}
										onClick={onNavegar}
										title={colapsado ? etiqueta : undefined}
										className={cn(
											"group flex h-8 items-center gap-2.5 rounded-md px-2 text-sm text-lateral-suave transition-colors hover:bg-lateral-elevada hover:text-lateral-tinta",
											"[&.active]:bg-lateral-elevada [&.active]:font-medium [&.active]:text-lateral-tinta",
											colapsado && "justify-center px-0",
										)}
									>
										<Icono
											aria-hidden
											className="size-4 shrink-0 text-lateral-tenue group-[.active]:text-lateral-acento"
										/>
										<span className={cn("truncate", colapsado && "sr-only")}>
											{etiqueta}
										</span>
									</Link>
								</li>
							))}
						</ul>
					</div>
				))}
			</nav>

			{onAlternar && (
				<div
					className={cn(
						"border-t border-lateral-borde p-3",
						colapsado && "px-0 text-center",
					)}
				>
					<button
						type="button"
						onClick={onAlternar}
						aria-label={colapsado ? "Expandir menú" : "Colapsar menú"}
						title={colapsado ? "Expandir menú" : "Colapsar menú"}
						className="inline-flex size-8 items-center justify-center rounded-md text-lateral-tenue transition-colors hover:bg-lateral-elevada hover:text-lateral-tinta"
					>
						{colapsado ? (
							<PanelLeftOpen className="size-4" />
						) : (
							<PanelLeftClose className="size-4" />
						)}
					</button>
				</div>
			)}
		</div>
	);
}
