import type { EventBus } from "@/core/shared/domain/events/EventBus";
import type { UnitOfWork } from "@/core/shared/domain/UnitOfWork";
import { SinPermisoTareasError } from "../../domain/error/SinPermisoTareasError";
import type { TareaRepository } from "../../domain/repository/TareaRepository";
import { type DestinoTarea, Tarea } from "../../domain/Tarea";
import type { TareaDto } from "../dtos/TareaDto";
import { TareaMapper } from "../mappers/TareaMapper";
import type { ContextosTarea } from "../services/ContextosTarea";
import { buscarTareaVisible } from "./buscarTareaVisible";

const SUFIJO_COPIA = " (copia)";
const MAX_TITULO = 255;

/**
 * Clona una tarea en el mismo contexto, en estado `pendiente`, sin comentarios
 * ni historial y con sus subtareas reiniciadas.
 */
export class DuplicarTareaUseCase {
	constructor(
		private readonly tareaRepository: TareaRepository,
		private readonly contextos: ContextosTarea,
		private readonly eventBus: EventBus,
		private readonly uow: UnitOfWork,
	) {}

	async ejecutar(usuarioId: number, id: number): Promise<TareaDto> {
		const { tarea, contexto } = await buscarTareaVisible(
			this.tareaRepository,
			this.contextos,
			usuarioId,
			id,
		);
		if (contexto && !contexto.puedeCrear) {
			throw new SinPermisoTareasError();
		}
		const datos = tarea.getDatos();
		const titulo = `${datos.titulo.slice(0, MAX_TITULO - SUFIJO_COPIA.length)}${SUFIJO_COPIA}`;
		const ubicacion = tarea.getUbicacion();
		let en: ({ organizacionId: number } & DestinoTarea) | undefined;
		if (ubicacion.organizacionId !== null) {
			if (ubicacion.equipoId !== null) {
				en = {
					organizacionId: ubicacion.organizacionId,
					equipoId: ubicacion.equipoId,
				};
			} else if (ubicacion.proyectoId !== null) {
				en = {
					organizacionId: ubicacion.organizacionId,
					proyectoId: ubicacion.proyectoId,
				};
			} else {
				en = { organizacionId: ubicacion.organizacionId };
			}
		}

		const copia = Tarea.crear(
			usuarioId,
			{
				titulo,
				contenido: datos.contenido,
				estado: "pendiente",
				prioridad: datos.prioridad,
				fechaInicio: null,
				fechaVencimiento: null,
				color: datos.color,
				isFijada: false,
				tagIds: datos.tagIds,
				dependeDeId: null,
				recurrencia: datos.recurrencia,
				subtareas: datos.subtareas.map((sub) => ({
					titulo: sub.titulo,
					completada: false,
				})),
			},
			en,
		);
		copia.mencionar(contexto?.miembroIds ?? []);

		const creada = await this.uow.ejecutar(async () => {
			const creada = await this.tareaRepository.crear(copia);
			creada.agregarEventoCreada();
			await this.eventBus.publishAll(creada.pullDomainEvents());
			return creada;
		});
		return TareaMapper.toDto(creada);
	}
}
