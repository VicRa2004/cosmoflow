import type { PreferenciasInterfaz } from "../PreferenciasInterfaz";

/** Una fila por usuario; sin fila, las predeterminadas. */
export interface PreferenciaRepository {
	/** Lo guardado tal cual (puede faltar alguna opción nueva); `{}` si nunca guardó. */
	obtener: (usuarioId: number) => Promise<Partial<PreferenciasInterfaz>>;
	guardar: (usuarioId: number, datos: PreferenciasInterfaz) => Promise<void>;
}
