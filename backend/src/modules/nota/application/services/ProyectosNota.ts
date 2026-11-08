import type { TareasProyecto } from "@/modules/proyecto";
import { CarpetaInvalidaError } from "../../domain/error/CarpetaInvalidaError";
import { NotaNoEncontradaError } from "../../domain/error/NotaNoEncontradaError";
import { ProyectoNoEncontradoError } from "../../domain/error/ProyectoNoEncontradoError";
import { TagsAjenosError } from "../../domain/error/TagsAjenosError";
import type { Nota, ProyectoNota } from "../../domain/Nota";
import type {
	AmbitoNotas,
	NotaRepository,
} from "../../domain/repository/NotaRepository";

interface ConAmbito {
	getUsuarioId(): number;
	getProyecto(): ProyectoNota | null;
}

/** Personales de su dueño o las del proyecto. */
export const ambitoDe = (x: ConAmbito): AmbitoNotas => {
	const proyecto = x.getProyecto();
	return proyecto
		? { proyectoId: proyecto.proyectoId }
		: { usuarioId: x.getUsuarioId() };
};

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

	/** Nota o carpeta: su dueño si es personal, los miembros si es de proyecto. */
	async ve(usuarioId: number, x: ConAmbito): Promise<boolean> {
		const proyecto = x.getProyecto();
		return proyecto
			? (await this.proyectos.contexto(usuarioId, proyecto.proyectoId)) !== null
			: x.getUsuarioId() === usuarioId;
	}

	async buscarVisible(usuarioId: number, id: number): Promise<Nota> {
		const nota = await this.notaRepository.buscarPorId(id);
		if (!nota || !(await this.ve(usuarioId, nota))) {
			throw new NotaNoEncontradaError();
		}
		return nota;
	}

	/**
	 * Tags del dueño (personal) o de la organización del proyecto (RN-60), y
	 * carpeta del mismo ámbito que la nota.
	 */
	async validarReferencias(nota: Nota): Promise<void> {
		const { carpetaId } = nota.getDatos();
		if (
			carpetaId !== null &&
			!(await this.notaRepository.esCarpetaDe(ambitoDe(nota), carpetaId))
		) {
			throw new CarpetaInvalidaError();
		}
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
