import { Link } from "@tanstack/react-router";
import { Checkbox } from "@/core/components/ui/Checkbox";
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
	const { tags } = useTagsDisponibles(organizacionId);
	const marcados = new Set(valor);

	return (
		<fieldset className="space-y-2">
			<legend className="text-[13px] font-medium text-tinta-suave">Tags</legend>
			{tags.length === 0 && organizacionId ? (
				<p className="text-xs text-tinta-tenue">
					La organización aún no tiene tags.
				</p>
			) : tags.length === 0 ? (
				<p className="text-xs text-tinta-tenue">
					Aún no tienes tags.{" "}
					<Link to="/tags" className="text-indigo-400 hover:underline">
						Crear tags
					</Link>
				</p>
			) : (
				<div className="flex flex-wrap gap-x-4 gap-y-2">
					{tags.map((tag) => (
						<Checkbox
							key={tag.id}
							label={
								<span className="flex items-center gap-1.5">
									<PuntoColor color={tag.color} className="h-2 w-2" />
									{tag.nombre}
								</span>
							}
							checked={marcados.has(tag.id)}
							onChange={(e) =>
								onChange(
									e.target.checked
										? [...valor, tag.id]
										: valor.filter((id) => id !== tag.id),
								)
							}
						/>
					))}
				</div>
			)}
		</fieldset>
	);
}
