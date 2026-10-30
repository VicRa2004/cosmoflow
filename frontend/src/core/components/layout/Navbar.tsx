import { useRouterState, useSearch } from "@tanstack/react-router";
import { ChevronRight, Menu } from "lucide-react";
import { Button } from "@/core/components/ui/Button";
import { useNotaQuery } from "@/modules/notas/hooks/useNotasQuery";
import { MigasContexto } from "@/modules/organizaciones/components/MigasContexto";
import { useTareaQuery } from "@/modules/tareas/hooks/useTareasQuery";
import { MenuUsuario } from "./MenuUsuario";
import { NAVEGACION } from "./navegacion";
import { SelectorTema } from "./SelectorTema";

const FUERA_DEL_MENU: Record<string, string> = { "/perfil": "Mi perfil" };

/**
 * Organización, equipo o proyecto de las tareas y notas compartidas: de la URL en
 * listas y altas, de la tarea o nota (ya en caché) al leerla o editarla. Sin él, son personales.
 */
function useContextoCompartido() {
	const ruta = useRouterState({ select: (estado) => estado.location.pathname });
	const search = useSearch({ strict: false });
	const [, tipo, id] = ruta.match(/^\/(tareas|notas)\/(\d+)(\/editar)?$/) ?? [];
	const { data: tarea } = useTareaQuery(
		tipo === "tareas" ? Number(id) : undefined,
	);
	const { data: nota } = useNotaQuery(
		tipo === "notas" ? Number(id) : undefined,
	);
	if (!/^\/(tareas|notas)(\/|$)/.test(ruta)) return undefined;
	const origen =
		search.organizacionId !== undefined
			? search
			: (tarea ?? { ...nota, equipoId: undefined });
	return origen.organizacionId
		? {
				organizacionId: origen.organizacionId,
				equipoId: origen.equipoId,
				proyectoId: origen.proyectoId,
			}
		: undefined;
}

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
	const contexto = useContextoCompartido();

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
					{contexto ? (
						<MigasContexto {...contexto} />
					) : (
						grupo && (
							<li className="hidden items-center gap-1.5 text-tinta-tenue sm:flex">
								{grupo}
								<ChevronRight aria-hidden className="size-3.5" />
							</li>
						)
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
