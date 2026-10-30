import type { Adjunto } from "../Adjunto";
import type { CompartirAdjuntos } from "../CompartirAdjuntos";

export interface AdjuntoRepository extends CompartirAdjuntos {
	crear: (datos: Omit<Adjunto, "id">) => Promise<Adjunto>;
	/** Sin filtrar por dueño: quién lo ve lo decide `ObtenerAdjuntoUseCase`. */
	buscarPorId: (id: number) => Promise<Adjunto | null>;
	/** Al eliminar el equipo o proyecto, sus adjuntos pasan a la organización. */
	pasarAOrganizacion: (
		organizacionId: number,
		grupo: { equipoId: number } | { proyectoId: number },
	) => Promise<void>;
}
