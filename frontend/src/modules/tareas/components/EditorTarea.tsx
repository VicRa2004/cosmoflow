import type { ComponentProps } from "react";
import { EditorMarkdown } from "@/modules/adjuntos/components/EditorMarkdown";
import { useMiembrosDestino } from "../hooks/useMiembrosDestino";

type PropsEditor = Omit<ComponentProps<typeof EditorMarkdown>, "mencionables">;

/** En una tarea compartida, `@` menciona a quien la ve; en las personales no hay a quién. */
export function EditorTarea({
	organizacionId,
	equipoId,
	proyectoId,
	...props
}: PropsEditor & {
	organizacionId: number | null;
	equipoId?: number | null;
	proyectoId?: number | null;
}) {
	return organizacionId === null ? (
		<EditorMarkdown {...props} />
	) : (
		<EditorCompartida
			{...props}
			organizacionId={organizacionId}
			equipoId={equipoId}
			proyectoId={proyectoId}
		/>
	);
}

function EditorCompartida({
	organizacionId,
	equipoId,
	proyectoId,
	...props
}: PropsEditor & {
	organizacionId: number;
	equipoId?: number | null;
	proyectoId?: number | null;
}) {
	const mencionables = useMiembrosDestino(organizacionId, equipoId, proyectoId);
	return <EditorMarkdown {...props} mencionables={mencionables} />;
}
