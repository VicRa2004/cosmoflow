/** Eventos que se pueden notificar (RN-92). Las preferencias se guardan con estos nombres. */
export const EVENTOS_NOTIFICACION = [
	"tareaAsignada",
	"estadoCambiado",
] as const;
export type EventoNotificacion = (typeof EVENTOS_NOTIFICACION)[number];

/** Canales con adaptador (`CanalNotificacion`). */
export const CANALES_NOTIFICACION = ["correo"] as const;
export type CanalId = (typeof CANALES_NOTIFICACION)[number];

/** Sin preferencia guardada: el correo avisa de todo. */
export const ACTIVO_POR_DEFECTO: Record<CanalId, boolean> = { correo: true };

export interface Preferencia {
	evento: EventoNotificacion;
	canal: CanalId;
	activo: boolean;
}

/** Matriz completa evento × canal: lo guardado y, si no hay, el valor por defecto. */
export function resolverPreferencias(guardadas: Preferencia[]): Preferencia[] {
	return EVENTOS_NOTIFICACION.flatMap((evento) =>
		CANALES_NOTIFICACION.map((canal) => ({
			evento,
			canal,
			activo:
				guardadas.find((p) => p.evento === evento && p.canal === canal)
					?.activo ?? ACTIVO_POR_DEFECTO[canal],
		})),
	);
}
