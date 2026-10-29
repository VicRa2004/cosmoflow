import type { PermisoDto } from "../api/rolesApi";
import { agruparPorRecurso } from "../utils/agruparPorRecurso";

interface PermisosChecklistProps {
	permisos: PermisoDto[];
	seleccionados: Set<number>;
	onToggle: (permisoId: number) => void;
}

const ACCIONES_BASE = ["crear", "leer", "actualizar", "eliminar"];
const NOMBRES: Record<string, string> = {
	adjuntos: "Adjuntos",
	asignaciones: "Asignaciones",
	auditoria: "Auditoría",
	notas: "Notas",
	permisos: "Permisos",
	roles: "Roles",
	tags: "Tags",
	tareas: "Tareas",
	usuarios: "Usuarios",
};
const humano = (texto: string) =>
	NOMBRES[texto] ?? texto.charAt(0).toUpperCase() + texto.slice(1);

/** Matriz de permisos: una fila por recurso y una columna por acción. */
export function PermisosChecklist({
	permisos,
	seleccionados,
	onToggle,
}: PermisosChecklistProps) {
	const acciones = [
		...ACCIONES_BASE,
		...new Set(
			permisos.map((p) => p.accion).filter((a) => !ACCIONES_BASE.includes(a)),
		),
	];

	return (
		<div className="overflow-x-auto">
			<table className="w-full text-sm">
				<caption className="sr-only">Permisos que concede el rol</caption>
				<thead>
					<tr className="border-b border-borde text-xs text-tinta-tenue">
						<th scope="col" className="h-8 pr-4 text-left font-medium">
							Recurso
						</th>
						{acciones.map((accion) => (
							<th
								key={accion}
								scope="col"
								className="h-8 w-24 px-2 text-center font-medium"
							>
								{humano(accion)}
							</th>
						))}
					</tr>
				</thead>
				<tbody className="divide-y divide-borde">
					{agruparPorRecurso(permisos).map(([recurso, delRecurso]) => (
						<tr key={recurso}>
							<th
								scope="row"
								className="h-9 pr-4 text-left font-normal text-tinta"
							>
								{humano(recurso)}
							</th>
							{acciones.map((accion) => {
								const permiso = delRecurso.find((p) => p.accion === accion);
								return (
									<td key={accion} className="px-2 text-center">
										{permiso ? (
											<input
												type="checkbox"
												aria-label={`${humano(accion)} ${humano(recurso).toLowerCase()}`}
												checked={seleccionados.has(permiso.id)}
												onChange={() => onToggle(permiso.id)}
												className="size-4 cursor-pointer align-middle accent-indigo-600"
											/>
										) : (
											<span aria-hidden className="text-tinta-tenue">
												–
											</span>
										)}
									</td>
								);
							})}
						</tr>
					))}
				</tbody>
			</table>
		</div>
	);
}
