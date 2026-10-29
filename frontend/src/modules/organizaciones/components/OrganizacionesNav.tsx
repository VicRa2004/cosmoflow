import { Link } from "@tanstack/react-router";
import { Building2 } from "lucide-react";
import { claseEnlaceLateral } from "@/core/components/layout/navegacion";
import { cn } from "@/core/utils/cn";
import { useOrganizacionesQuery } from "../hooks/useOrganizacionesQuery";
import { AvatarOrganizacion } from "./AvatarOrganizacion";

// shortcut: muestra las primeras 8; con más, el resto se alcanza desde «Todas».
const LIMITE = 8;

/** Grupo del sidebar para saltar entre mis organizaciones. */
export function OrganizacionesNav({
	colapsado,
	onNavegar,
}: {
	colapsado: boolean;
	onNavegar?: () => void;
}) {
	const { data } = useOrganizacionesQuery({ pagina: 1, limite: LIMITE });

	return (
		<div className="mt-4">
			{colapsado ? (
				<hr className="mx-2 mb-3 border-lateral-borde" />
			) : (
				<p className="px-2 pb-1.5 text-xs font-medium text-lateral-tenue">
					Organizaciones
				</p>
			)}
			<ul className="space-y-0.5">
				{data?.datos.map((organizacion) => (
					<li key={organizacion.id}>
						<Link
							to="/organizaciones/$id"
							params={{ id: String(organizacion.id) }}
							onClick={onNavegar}
							title={colapsado ? organizacion.nombre : undefined}
							className={claseEnlaceLateral(colapsado)}
						>
							<AvatarOrganizacion
								organizacion={organizacion}
								className="size-4 rounded text-[9px]"
							/>
							<span className={cn("truncate", colapsado && "sr-only")}>
								{organizacion.nombre}
							</span>
						</Link>
					</li>
				))}
				<li>
					<Link
						to="/organizaciones"
						activeOptions={{ exact: true }}
						onClick={onNavegar}
						title={colapsado ? "Todas las organizaciones" : undefined}
						className={claseEnlaceLateral(colapsado)}
					>
						<Building2
							aria-hidden
							className="size-4 shrink-0 text-lateral-tenue group-[.active]:text-lateral-acento"
						/>
						<span className={cn("truncate", colapsado && "sr-only")}>
							{data && data.totalElementos > 0 ? "Todas" : "Crear o ver"}
						</span>
					</Link>
				</li>
			</ul>
		</div>
	);
}
