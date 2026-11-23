import { Link } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { AvisoListaRecortada } from "@/core/components/ui/AvisoListaRecortada";
import { Badge } from "@/core/components/ui/Badge";
import { Combobox } from "@/core/components/ui/Combobox";
import { PuntoColor } from "@/core/components/ui/PuntoColor";
import { useTagsDisponibles } from "../hooks/useTagsDisponibles";

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

	if (tags.length === 0) {
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
