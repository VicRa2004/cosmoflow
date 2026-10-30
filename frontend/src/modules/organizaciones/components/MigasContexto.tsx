import { Link } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";
import {
	type ContextoCompartido,
	useNombresContexto,
} from "../hooks/useNombresContexto";

const claseMiga = "hidden items-center gap-1.5 text-tinta-tenue sm:flex";

/** «Acme › Plataforma ›» en el Navbar para las tareas y notas compartidas. */
export function MigasContexto(contexto: ContextoCompartido) {
	const { organizacion, grupo } = useNombresContexto(contexto);
	const conGrupo = Boolean(contexto.equipoId || contexto.proyectoId);

	return (
		<>
			<li className={claseMiga}>
				<Link
					to="/organizaciones/$id"
					params={{ id: String(contexto.organizacionId) }}
					className="hover:text-tinta"
				>
					{organizacion ?? "…"}
				</Link>
				<ChevronRight aria-hidden className="size-3.5" />
			</li>
			{conGrupo && (
				<li className={claseMiga}>
					{grupo ?? "…"}
					<ChevronRight aria-hidden className="size-3.5" />
				</li>
			)}
		</>
	);
}
