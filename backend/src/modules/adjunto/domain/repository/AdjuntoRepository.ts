import type { Adjunto } from "../Adjunto";
import type { CompartirAdjuntos } from "../CompartirAdjuntos";

export interface AdjuntoRepository extends CompartirAdjuntos {
	crear: (datos: Omit<Adjunto, "id">) => Promise<Adjunto>;
	/** Sin filtrar por dueño: quién lo ve lo decide `ObtenerAdjuntoUseCase`. */
	buscarPorId: (id: number) => Promise<Adjunto | null>;
}
