import { TareaNoEncontradaError } from "../../domain/error/TareaNoEncontradaError";
import type { TareaRepository } from "../../domain/repository/TareaRepository";
import type { Tarea } from "../../domain/Tarea";
import type { ContextoTarea, ContextosTarea } from "../services/ContextosTarea";

/**
 * Personal: solo su dueño. Compartida: los miembros de su equipo o proyecto.
 * Para cualquier otro no existe (404, RN-90).
 */
export async function buscarTareaVisible(
	repo: TareaRepository,
	contextos: ContextosTarea,
	usuarioId: number,
	id: number,
): Promise<{ tarea: Tarea; contexto: ContextoTarea | null }> {
	const tarea = await repo.buscarPorId(id);
	if (!tarea) throw new TareaNoEncontradaError();
	if (tarea.esPersonal()) {
		if (tarea.getUsuarioId() !== usuarioId) throw new TareaNoEncontradaError();
		return { tarea, contexto: null };
	}
	const contexto = await contextos.de(usuarioId, tarea.getUbicacion());
	if (!contexto) throw new TareaNoEncontradaError();
	return { tarea, contexto };
}
