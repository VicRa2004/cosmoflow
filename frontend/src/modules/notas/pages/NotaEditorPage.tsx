import { useCanGoBack, useNavigate, useRouter } from "@tanstack/react-router";
import { usePermisos } from "@/core/auth/usePermisos";
import { Spinner } from "@/core/components/ui/Spinner";
import { AccionesNota } from "../components/AccionesNota";
import { NotaForm } from "../components/NotaForm";
import { useNotaQuery } from "../hooks/useNotasQuery";
import type { ContextoNotaSearch } from "../schemas/notaSchemas";
import { NotaLecturaPage } from "./NotaLecturaPage";

const spinner = (
	<div className="flex justify-center py-16 text-tinta-tenue">
		<Spinner />
	</div>
);

/** Panel derecho de la bóveda: alta (sin `id`) o la nota lista para escribir. */
export function NotaEditorPage({
	id,
	contexto,
}: {
	id?: number;
	contexto?: ContextoNotaSearch;
}) {
	const router = useRouter();
	const navigate = useNavigate();
	const puedeVolver = useCanGoBack();
	const { puede, listo } = usePermisos();
	const { data, error } = useNotaQuery(id);
	const ambito = {
		organizacionId: data?.organizacionId ?? contexto?.organizacionId,
		proyectoId: data?.proyectoId ?? contexto?.proyectoId,
	};
	const aLaLista = () => navigate({ to: "/notas", search: ambito });
	const volver = () => (puedeVolver ? router.history.back() : aLaLista());

	if (error) throw error;
	if (id === undefined) {
		return (
			<NotaForm
				contexto={contexto}
				onVolver={volver}
				onCreada={(nota) =>
					navigate({
						to: "/notas/$id",
						params: { id: String(nota.id) },
						search: ambito,
						replace: true,
					})
				}
			/>
		);
	}
	if (!listo || !data) return spinner;
	if (!puede("notas:actualizar")) return <NotaLecturaPage id={id} />;
	return (
		<NotaForm
			key={id}
			inicial={data}
			onVolver={aLaLista}
			acciones={<AccionesNota nota={data} onEliminada={aLaLista} />}
		/>
	);
}
