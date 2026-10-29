import { Badge } from "@/core/components/ui/Badge";
import { useTagsDisponibles } from "../hooks/useTagsDisponibles";

/** Chips con el nombre de cada tag (de tareas, notas…). */
export function TagsBadges({ tagIds }: { tagIds: number[] }) {
	const { nombre } = useTagsDisponibles();
	return (
		<div className="flex flex-wrap gap-1">
			{tagIds.map((id) => (
				<Badge key={id}>{nombre.get(id) ?? "…"}</Badge>
			))}
		</div>
	);
}
