import { Badge } from "@/core/components/ui/Badge";
import { useTagsDisponibles } from "../hooks/useTagsDisponibles";

/** Chips con el nombre de cada tag (de tareas, notas…); `organizacionId` en las compartidas. */
export function TagsBadges({
	tagIds,
	organizacionId,
}: {
	tagIds: number[];
	organizacionId?: number | null;
}) {
	const { nombre } = useTagsDisponibles(organizacionId);
	return (
		<div className="flex flex-wrap gap-1">
			{tagIds.map((id) => (
				<Badge key={id}>{nombre.get(id) ?? "…"}</Badge>
			))}
		</div>
	);
}
