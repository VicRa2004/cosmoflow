import { Entity } from "@/core/shared/domain/Entity";
import { EntityId } from "@/core/shared/domain/EntityId";
import { TareaInvalidaError } from "./error/TareaInvalidaError";
import { ResponsablesAsignadosEvent } from "./event/ResponsablesAsignadosEvent";
import { TareaEstadoCambiadoEvent } from "./event/TareaEstadoCambiadoEvent";

export const ESTADOS_TAREA = [
	"pendiente",
	"en_progreso",
	"completada",
	"cancelada",
] as const;
export type EstadoTarea = (typeof ESTADOS_TAREA)[number];

export const PRIORIDADES_TAREA = ["baja", "media", "alta"] as const;
export type PrioridadTarea = (typeof PRIORIDADES_TAREA)[number];

export interface DatosTarea {
	titulo: string;
	/** Markdown (RN-41). */
	contenido: string;
	estado: EstadoTarea;
	prioridad: PrioridadTarea;
	/** Día `YYYY-MM-DD` (sin hora: no depende de la zona horaria) o `null`. */
	fechaInicio: string | null;
	fechaVencimiento: string | null;
	/** Personal: tags del dueño; compartida: de la organización (RN-60). */
	tagIds: number[];
}

/** Organización (sin equipo ni proyecto), equipo o proyecto de una tarea compartida. */
export type DestinoTarea =
	| { organizacionId: number }
	| { equipoId: number }
	| { proyectoId: number };

export interface UbicacionTarea {
	organizacionId: number | null;
	equipoId: number | null;
	proyectoId: number | null;
}

const PERSONAL: UbicacionTarea = {
	organizacionId: null,
	equipoId: null,
	proyectoId: null,
};

/**
 * Personal (RN-40: de su dueño) o compartida en la organización, un equipo o un proyecto, con
 * responsables (RN-44). Solo se mueve de personal a compartida (RN-45).
 */
export class Tarea extends Entity {
	private readonly usuarioId: number;
	private datos: DatosTarea;
	private ubicacion: UbicacionTarea;
	private responsableIds: number[];

	private constructor(
		id: EntityId,
		usuarioId: number,
		datos: DatosTarea,
		ubicacion: UbicacionTarea,
		responsableIds: number[],
	) {
		super(id);
		this.usuarioId = usuarioId;
		this.datos = Tarea.validar(datos);
		this.ubicacion = ubicacion;
		this.responsableIds = responsableIds;
	}

	/** Sin `en`, personal; con él, compartida en esa organización, equipo o proyecto. */
	public static crear(
		usuarioId: number,
		datos: Partial<DatosTarea> & { titulo: string },
		en?: { organizacionId: number } & DestinoTarea,
	): Tarea {
		const tarea = new Tarea(
			new EntityId(),
			usuarioId,
			Tarea.porDefecto(datos),
			PERSONAL,
			[],
		);
		if (en) tarea.ubicacion = Tarea.ubicar(en);
		return tarea;
	}

	private static porDefecto(
		datos: Partial<DatosTarea> & { titulo: string },
	): DatosTarea {
		return {
			contenido: "",
			estado: "pendiente",
			prioridad: "media",
			fechaInicio: null,
			fechaVencimiento: null,
			tagIds: [],
			...sinIndefinidos(datos),
			titulo: datos.titulo,
		};
	}

	private static ubicar({
		organizacionId,
		...destino
	}: { organizacionId: number } & DestinoTarea): UbicacionTarea {
		return {
			organizacionId,
			equipoId: "equipoId" in destino ? destino.equipoId : null,
			proyectoId: "proyectoId" in destino ? destino.proyectoId : null,
		};
	}

	public static reconstituir(
		id: number,
		usuarioId: number,
		datos: DatosTarea,
		ubicacion: UbicacionTarea = PERSONAL,
		responsableIds: number[] = [],
	): Tarea {
		return new Tarea(
			new EntityId(id),
			usuarioId,
			datos,
			ubicacion,
			responsableIds,
		);
	}

	/** Quien la creó; en las personales, su dueño. */
	getUsuarioId() {
		return this.usuarioId;
	}

	getUbicacion(): UbicacionTarea {
		return { ...this.ubicacion };
	}

	getResponsableIds(): readonly number[] {
		return this.responsableIds;
	}

	esPersonal(): boolean {
		return this.ubicacion.organizacionId === null;
	}

	/** RN-45: solo de personal a compartida. Sus tags personales no viajan. */
	public mover(destino: { organizacionId: number } & DestinoTarea): void {
		if (!this.esPersonal()) {
			throw new TareaInvalidaError("Una tarea compartida no se puede mover");
		}
		this.ubicacion = Tarea.ubicar(destino);
		this.datos = { ...this.datos, tagIds: [] };
	}

	/** RN-44: varios responsables; las personales no tienen. */
	public asignar(responsableIds: number[]): void {
		if (this.esPersonal() && responsableIds.length > 0) {
			throw new TareaInvalidaError("Una tarea personal no tiene responsables");
		}
		const unicos = [...new Set(responsableIds)];
		const nuevos = unicos.filter((id) => !this.responsableIds.includes(id));
		this.responsableIds = unicos;
		// Al crear aún no hay id: el caso de uso avisa tras guardar (`agregarEventoCreada`).
		if (nuevos.length > 0 && this.id.isPersisted()) {
			this.addDomainEvent(
				new ResponsablesAsignadosEvent({
					tareaId: this.getId(),
					usuarioIds: nuevos,
				}),
			);
		}
	}

	/** Tras guardarla por primera vez: sus responsables son todos nuevos. */
	public agregarEventoCreada(): void {
		if (this.responsableIds.length === 0) return;
		this.addDomainEvent(
			new ResponsablesAsignadosEvent({
				tareaId: this.getId(),
				usuarioIds: [...this.responsableIds],
			}),
		);
	}

	getDatos(): DatosTarea {
		return { ...this.datos, tagIds: [...this.datos.tagIds] };
	}

	/** `undefined` deja el campo como está; `null` vacía una fecha. */
	public actualizar(cambios: Partial<DatosTarea>): void {
		const anterior = this.datos.estado;
		this.datos = Tarea.validar({ ...this.datos, ...sinIndefinidos(cambios) });
		if (this.datos.estado !== anterior && this.id.isPersisted()) {
			this.addDomainEvent(
				new TareaEstadoCambiadoEvent({
					tareaId: this.getId(),
					creadorId: this.usuarioId,
					anterior,
					nuevo: this.datos.estado,
				}),
			);
		}
	}

	private static validar(datos: DatosTarea): DatosTarea {
		const { fechaInicio, fechaVencimiento } = datos;
		// Las fechas ISO de día se comparan bien como texto.
		if (fechaInicio && fechaVencimiento && fechaInicio > fechaVencimiento) {
			throw new TareaInvalidaError(
				"La fecha de inicio no puede ser posterior al vencimiento",
			);
		}
		return { ...datos, tagIds: [...new Set(datos.tagIds)] };
	}
}

function sinIndefinidos<T extends object>(objeto: T): Partial<T> {
	return Object.fromEntries(
		Object.entries(objeto).filter(([, valor]) => valor !== undefined),
	) as Partial<T>;
}
