import { Navigate, useNavigate } from "@tanstack/react-router";
import { FilePlus } from "lucide-react";
import { usePermisos } from "@/core/auth/usePermisos";
import { Button } from "@/core/components/ui/Button";
import { EmptyState } from "@/core/components/ui/EmptyState";
import { Spinner } from "@/core/components/ui/Spinner";
import { useCrearNotaMutation } from "../hooks/useNotasMutation";
import { useNotasQuery } from "../hooks/useNotasQuery";
import type { ContextoNotaSearch } from "../schemas/notaSchemas";

/** Destino de un `[[wikilink]]`: abre la nota con ese título o, como Obsidian, ofrece crearla. */
export function WikilinkPage({
	titulo,
	organizacionId,
	proyectoId,
}: ContextoNotaSearch & { titulo: string }) {
	const navigate = useNavigate();
	const { puede } = usePermisos();
	const crear = useCrearNotaMutation();
	const { data, error } = useNotasQuery({ titulo, proyectoId, limite: 1 });

	if (error) throw error;
	if (!data) {
		return (
			<div className="flex justify-center py-16 text-tinta-tenue">
				<Spinner />
			</div>
		);
	}
	const [nota] = data.datos;
	if (nota) {
		return (
			<Navigate to="/notas/$id" params={{ id: String(nota.id) }} replace />
		);
	}
	return (
		<EmptyState
			icono={FilePlus}
			titulo={`No hay ninguna nota «${titulo}»`}
			descripcion={
				organizacionId && proyectoId
					? "Se buscó en las notas de este proyecto."
					: "Se buscó en tus notas personales."
			}
			accion={
				puede("notas:crear") && (
					<Button
						isLoading={crear.isPending}
						onClick={() =>
							crear.mutate(
								{ titulo, ...(proyectoId && { proyectoId }) },
								{
									onSuccess: (creada) =>
										navigate({
											to: "/notas/$id/editar",
											params: { id: String(creada.id) },
											replace: true,
										}),
								},
							)
						}
					>
						Crear «{titulo}»
					</Button>
				)
			}
		/>
	);
}
