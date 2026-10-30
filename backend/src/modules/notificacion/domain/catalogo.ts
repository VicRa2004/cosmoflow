/** Eventos que se pueden notificar (RN-92). Las preferencias se guardan con estos nombres. */
export const EVENTOS_NOTIFICACION = [
	"tareaAsignada",
	"estadoCambiado",
] as const;
export type EventoNotificacion = (typeof EVENTOS_NOTIFICACION)[number];

/** Canales con adaptador (`CanalNotificacion`). */
export const CANALES_NOTIFICACION = ["correo", "telegram"] as const;
export type CanalId = (typeof CANALES_NOTIFICACION)[number];

/** Sin preferencia guardada: el correo avisa de todo; Telegram, solo si se activa. */
export const ACTIVO_POR_DEFECTO: Record<CanalId, boolean> = {
	correo: true,
	telegram: false,
};

export interface Preferencia {
	evento: EventoNotificacion;
	canal: CanalId;
	activo: boolean;
}

/**
 * Matriz completa evento × canal. Cada celda toma la primera capa que la tenga
 * (usuario, luego organización: RN-92) y, si ninguna, el valor por defecto.
 */
export function resolverPreferencias(...capas: Preferencia[][]): Preferencia[] {
	return EVENTOS_NOTIFICACION.flatMap((evento) =>
		CANALES_NOTIFICACION.map((canal) => {
			const elegida = capas
				.flat()
				.find((p) => p.evento === evento && p.canal === canal);
			return {
				evento,
				canal,
				activo: elegida?.activo ?? ACTIVO_POR_DEFECTO[canal],
			};
		}),
	);
}

/** Para el perfil: `personalizado` dice si eligió él o vale lo de cada organización. */
export interface PreferenciaUsuario extends Preferencia {
	personalizado: boolean;
}

export function preferenciasDeUsuario(
	guardadas: Preferencia[],
): PreferenciaUsuario[] {
	return resolverPreferencias(guardadas).map((p) => ({
		...p,
		personalizado: guardadas.some(
			(g) => g.evento === p.evento && g.canal === p.canal,
		),
	}));
}
