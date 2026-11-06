import { Badge } from "@/core/components/ui/Badge";
import { PuntoColor } from "@/core/components/ui/PuntoColor";
import { useTagsDisponibles } from "../hooks/useTagsDisponibles";

/** Chips con el nombre de cada tag (de tareas, notas…); `organizacionId` en las compartidas. */
export function TagsBadges({
	tagIds,
	organizacionId,
}: {
	tagIds: number[];
	organizacionId?: number | null;
}) {
	const { tags } = useTagsDisponibles(organizacionId);
	const porId = new Map(tags.map((t) => [t.id, t]));
	if (tagIds.length === 0) {
		return <span className="text-tinta-tenue">Sin tags</span>;
	}
	return (
		<div className="flex flex-wrap gap-1">
			{tagIds.map((id) => (
				<Badge key={id} className="gap-1.5">
					<PuntoColor color={porId.get(id)?.color} className="h-2 w-2" />
					{porId.get(id)?.nombre ?? "…"}
				</Badge>
			))}
		</div>
	);
}
