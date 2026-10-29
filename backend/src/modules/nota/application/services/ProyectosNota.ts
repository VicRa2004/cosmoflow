import type { TareasProyecto } from "@/modules/proyecto";
import { NotaNoEncontradaError } from "../../domain/error/NotaNoEncontradaError";
import { ProyectoNoEncontradoError } from "../../domain/error/ProyectoNoEncontradoError";
import { TagsAjenosError } from "../../domain/error/TagsAjenosError";
import type { Nota, ProyectoNota } from "../../domain/Nota";
import type { NotaRepository } from "../../domain/repository/NotaRepository";

/**
 * Personal: solo su dueño. De proyecto: los miembros de sus equipos y los
 * integrantes sueltos (RN-33). Para cualquier otro no existe (404, RN-90).
 */
export class ProyectosNota {
	constructor(
		private readonly notaRepository: NotaRepository,
		private readonly proyectos: TareasProyecto,
	) {}

	/** 404 si el proyecto no existe o quien pide no es miembro. */
	async exigir(usuarioId: number, proyectoId: number): Promise<ProyectoNota> {
		const contexto = await this.proyectos.contexto(usuarioId, proyectoId);
		if (!contexto) throw new ProyectoNoEncontradoError();
		return { organizacionId: contexto.organizacionId, proyectoId };
	}

	async buscarVisible(usuarioId: number, id: number): Promise<Nota> {
		const nota = await this.notaRepository.buscarPorId(id);
		const proyecto = nota?.getProyecto();
		const visible =
			nota &&
			(proyecto
				? (await this.proyectos.contexto(usuarioId, proyecto.proyectoId)) !==
					null
				: nota.getUsuarioId() === usuarioId);
		if (!nota || !visible) throw new NotaNoEncontradaError();
		return nota;
	}

	/** Tags del dueño (personal) o de la organización del proyecto (RN-60). */
	async validarTags(nota: Nota): Promise<void> {
		const { tagIds } = nota.getDatos();
		const proyecto = nota.getProyecto();
		const dueno = proyecto
			? { organizacionId: proyecto.organizacionId }
			: { usuarioId: nota.getUsuarioId() };
		if (
			tagIds.length > 0 &&
			!(await this.notaRepository.sonTagsDe(dueno, tagIds))
		) {
			throw new TagsAjenosError();
		}
	}
}
