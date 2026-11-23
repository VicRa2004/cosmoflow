import { Link } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { usePermisos } from "@/core/auth/usePermisos";
import { AvisoListaRecortada } from "@/core/components/ui/AvisoListaRecortada";
import { Badge } from "@/core/components/ui/Badge";
import { Combobox } from "@/core/components/ui/Combobox";
import { PuntoColor } from "@/core/components/ui/PuntoColor";
import { useOrganizacionQuery } from "@/modules/organizaciones/hooks/useOrganizacionesQuery";
import { puedeEn } from "@/modules/organizaciones/utils/permisos";
import { useTagsDisponibles } from "../hooks/useTagsDisponibles";
import { useCrearTagMutation } from "../hooks/useTagsMutation";

/** Los personales con `tags:crear`; los de una organización, con su `tags:gestionar`. */
function usePuedeCrearTag(organizacionId?: number | null) {
	const { puede } = usePermisos();
	const { data: organizacion } = useOrganizacionQuery(
		organizacionId ?? 0,
		!!organizacionId,
	);
	if (!organizacionId) return puede("tags:crear");
	return !!organizacion && puedeEn(organizacion, "tags:gestionar");
}

interface SelectorTagsProps {
	valor: number[];
	onChange: (tagIds: number[]) => void;
	/** En una tarea compartida, los tags de su organización (RN-60). */
	organizacionId?: number | null;
}

export function SelectorTags({
	valor,
	onChange,
	organizacionId,
}: SelectorTagsProps) {
	const { tags, aviso } = useTagsDisponibles(organizacionId);
	const elegidos = tags.filter((t) => valor.includes(t.id));
	const puedeCrear = usePuedeCrearTag(organizacionId);
	const crearTag = useCrearTagMutation(organizacionId ?? undefined);

	if (tags.length === 0 && !puedeCrear) {
		return (
			<div className="space-y-1.5">
				<p className="text-[13px] font-medium text-tinta-suave">Tags</p>
				{organizacionId ? (
					<p className="text-xs text-tinta-tenue">
						La organización aún no tiene tags.
					</p>
				) : (
					<p className="text-xs text-tinta-tenue">
						Aún no tienes tags.{" "}
						<Link to="/tags" className="text-indigo-400 hover:underline">
							Crear tags
						</Link>
					</p>
				)}
			</div>
		);
	}

	return (
		<div className="space-y-2">
			<Combobox
				multiple
				label="Tags"
				opciones={tags.map((tag) => ({
					id: tag.id,
					etiqueta: tag.nombre,
					icono: <PuntoColor color={tag.color} className="h-2 w-2" />,
				}))}
				valor={valor}
				onChange={onChange}
				vacio={puedeCrear ? "Escribe para crear un tag" : undefined}
				onCrear={
					puedeCrear
						? (nombre) =>
								crearTag.mutate(
									{ nombre },
									{ onSuccess: (tag) => onChange([...valor, tag.id]) },
								)
						: undefined
				}
			>
				{elegidos.length === 0 ? (
					<span className="flex items-center gap-1.5 text-tinta-tenue">
						<Plus aria-hidden className="size-4" />
						Sin tags
					</span>
				) : (
					<span className="flex flex-wrap gap-1 py-1.5">
						{elegidos.map((tag) => (
							<Badge key={tag.id} className="gap-1.5">
								<PuntoColor color={tag.color} className="h-2 w-2" />
								{tag.nombre}
							</Badge>
						))}
					</span>
				)}
			</Combobox>
			<AvisoListaRecortada aviso={aviso} />
		</div>
	);
}
