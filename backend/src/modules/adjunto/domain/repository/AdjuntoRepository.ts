import type { Adjunto } from "../Adjunto";

export interface AdjuntoRepository {
	crear: (datos: Omit<Adjunto, "id">) => Promise<Adjunto>;
	/** Acotado al dueño: el adjunto de otro usuario no existe para quien lo pide (404). */
	buscarPorId: (usuarioId: number, id: number) => Promise<Adjunto | null>;
}
