import type { NotificacionApp } from "../api/notificacionesApi";

type Evento = NonNullable<NotificacionApp["evento"]>;

export const ETIQUETAS_EVENTO: Record<Evento, string> = {
	tareaAsignada: "Tarea asignada",
	mencion: "Te mencionaron",
	comentario: "Nuevo comentario",
	estadoCambiado: "Cambio de estado",
	vencimiento: "Vence pronto",
	resumenDiario: "Resumen del día",
};

interface Persona {
	id: number;
	nombre: string;
}

/** «tú» si es quien mira la campana. */
const nombreDe = (persona: Persona, yoId?: number) =>
	persona.id === yoId ? "tú" : persona.nombre;

/**
 * Líneas «Encargado» y «Asignó» de una tarea avisada. Si todos se asignaron a sí
 * mismos lo dice en vez de repetir el nombre; `asigno` es `null` si no se sabe.
 */
export function describirResponsables(
	responsables: NonNullable<NotificacionApp["tarea"]>["responsables"],
	yoId?: number,
): { encargado: string; asigno: string | null } {
	if (responsables.length === 0) {
		return { encargado: "Sin encargado", asigno: null };
	}
	const encargado = responsables.map((r) => nombreDe(r, yoId)).join(", ");
	if (responsables.every((r) => r.asignadoPor?.id === r.id)) {
		return { encargado, asigno: "la misma persona" };
	}
	const asignadores = new Map(
		responsables.flatMap((r) =>
			r.asignadoPor ? [[r.asignadoPor.id, r.asignadoPor] as const] : [],
		),
	);
	const asigno = [...asignadores.values()]
		.map((p) => nombreDe(p, yoId))
		.join(", ");
	return { encargado, asigno: asigno || null };
}
