import { extraerMenciones } from "@/core/shared/domain/menciones";
import { Entity } from "@/core/shared/domain/Entity";
import { EntityId } from "@/core/shared/domain/EntityId";
import { TareaInvalidaError } from "./error/TareaInvalidaError";
import { ResponsablesAsignadosEvent } from "./event/ResponsablesAsignadosEvent";
import {
	type CampoHistorial,
	TareaActualizadaEvent,
} from "./event/TareaActualizadaEvent";
import { TareaCreadaEvent } from "./event/TareaCreadaEvent";
import { TareaEstadoCambiadoEvent } from "./event/TareaEstadoCambiadoEvent";
import { TareaMovidaEvent } from "./event/TareaMovidaEvent";
import { TareaMencionadosEvent } from "./event/TareaMencionadosEvent";

export const ESTADOS_TAREA = [
	"pendiente",
	"en_progreso",
	"completada",
	"cancelada",
] as const;
export type EstadoTarea = (typeof ESTADOS_TAREA)[number];

export const PRIORIDADES_TAREA = ["baja", "media", "alta"] as const;
export type PrioridadTarea = (typeof PRIORIDADES_TAREA)[number];

export const RECURRENCIAS_TAREA = ["diaria", "semanal", "mensual"] as const;
export type RecurrenciaTarea = (typeof RECURRENCIAS_TAREA)[number];

export interface SubtareaTarea {
	id?: number;
	titulo: string;
	completada: boolean;
}

export interface DatosTarea {
	titulo: string;
	/** Markdown (RN-41). */
	contenido: string;
	estado: EstadoTarea;
	prioridad: PrioridadTarea;
	/** Día `YYYY-MM-DD` (sin hora: no depende de la zona horaria) o `null`. */
	fechaInicio: string | null;
	fechaVencimiento: string | null;
	/** Color de acento (#rrggbb) o `null`. */
	color: string | null;
	/** Personal: tags del dueño; compartida: de la organización (RN-60). */
	tagIds: number[];
	/** Tarea principal (mismo sitio): hasta completarla, esta no empieza ni se completa. */
	dependeDeId: number | null;
	/** Recurrencia (#57): al completarla se crea la siguiente con fechas desplazadas. */
	recurrencia: RecurrenciaTarea | null;
	/** Checklist de subtareas en orden (#57). */
	subtareas: SubtareaTarea[];
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
	/** Responsable → quien lo asignó (las asignaciones antiguas no lo tienen). */
	private asignadoPor: Record<number, number>;
	private mencionIds: number[];
	/** Su principal sigue sin completar (dato de lectura). */
	private readonly bloqueada: boolean;

	private constructor(
		id: EntityId,
		usuarioId: number,
		datos: DatosTarea,
		ubicacion: UbicacionTarea,
		responsableIds: number[],
		mencionIds: number[],
		bloqueada = false,
		asignadoPor: Record<number, number> = {},
	) {
		super(id);
		this.asignadoPor = asignadoPor;
		this.bloqueada = bloqueada;
		this.usuarioId = usuarioId;
		this.datos = Tarea.validar(datos);
		this.ubicacion = ubicacion;
		this.responsableIds = responsableIds;
		this.mencionIds = mencionIds;
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
			color: null,
			tagIds: [],
			dependeDeId: null,
			recurrencia: null,
			subtareas: [],
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
		mencionIds: number[] = [],
		bloqueada = false,
		asignadoPor: Record<number, number> = {},
	): Tarea {
		return new Tarea(
			new EntityId(id),
			usuarioId,
			datos,
			ubicacion,
			responsableIds,
			mencionIds,
			bloqueada,
			asignadoPor,
		);
	}

	isBloqueada(): boolean {
		return this.bloqueada;
	}

	/** Solo puede depender de otra del mismo sitio (y, si es personal, del mismo dueño). */
	mismoSitioQue(otra: Tarea): boolean {
		const a = this.ubicacion;
		const b = otra.ubicacion;
		return a.organizacionId === null
			? b.organizacionId === null && this.usuarioId === otra.usuarioId
			: a.organizacionId === b.organizacionId &&
					a.equipoId === b.equipoId &&
					a.proyectoId === b.proyectoId;
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

	getAsignadoPor(): Readonly<Record<number, number>> {
		return this.asignadoPor;
	}

	getMencionIds(): readonly number[] {
		return this.mencionIds;
	}

	/**
	 * Recalcula las menciones del contenido, solo de quien tiene acceso a la tarea (el
	 * resto se descarta sin error). Llamar tras `actualizar`, con los miembros del destino.
	 */
	public mencionar(conAcceso: readonly number[]): void {
		const mencionIds = extraerMenciones(this.datos.contenido).filter((id) =>
			conAcceso.includes(id),
		);
		const nuevos = mencionIds.filter((id) => !this.mencionIds.includes(id));
		this.mencionIds = mencionIds;
		if (nuevos.length > 0 && this.id.isPersisted()) {
			this.addDomainEvent(
				new TareaMencionadosEvent({
					tareaId: this.getId(),
					usuarioIds: nuevos,
				}),
			);
		}
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
		// Sus tags y su dependencia eran del sitio anterior.
		this.datos = { ...this.datos, tagIds: [], dependeDeId: null };
		this.addDomainEvent(
			new TareaMovidaEvent({
				tareaId: this.getId(),
				organizacionId: destino.organizacionId,
				equipoId: this.ubicacion.equipoId,
				proyectoId: this.ubicacion.proyectoId,
			}),
		);
	}

	/** RN-44: varios responsables; las personales no tienen. */
	/** `porUsuarioId` queda como quien asignó a los nuevos; los que siguen conservan el suyo. */
	public asignar(responsableIds: number[], porUsuarioId: number): void {
		if (this.esPersonal() && responsableIds.length > 0) {
			throw new TareaInvalidaError("Una tarea personal no tiene responsables");
		}
		const unicos = [...new Set(responsableIds)];
		const nuevos = unicos.filter((id) => !this.responsableIds.includes(id));
		this.responsableIds = unicos;
		const anterior = this.asignadoPor;
		this.asignadoPor = {};
		for (const id of unicos) {
			const por = nuevos.includes(id) ? porUsuarioId : anterior[id];
			if (por !== undefined) this.asignadoPor[id] = por;
		}
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

	/** Tras guardarla por primera vez: sus responsables y menciones son todos nuevos. */
	public agregarEventoCreada(): void {
		this.addDomainEvent(new TareaCreadaEvent({ tareaId: this.getId() }));
		if (this.responsableIds.length > 0) {
			this.addDomainEvent(
				new ResponsablesAsignadosEvent({
					tareaId: this.getId(),
					usuarioIds: [...this.responsableIds],
				}),
			);
		}
		if (this.mencionIds.length > 0) {
			this.addDomainEvent(
				new TareaMencionadosEvent({
					tareaId: this.getId(),
					usuarioIds: [...this.mencionIds],
				}),
			);
		}
	}

	getDatos(): DatosTarea {
		return {
			...this.datos,
			tagIds: [...this.datos.tagIds],
			subtareas: this.datos.subtareas.map((sub) => ({ ...sub })),
		};
	}

	/**
	 * Crea la siguiente ocurrencia de una tarea recurrente (#57): pendiente, sin
	 * dependencia, subtareas reiniciadas y fechas desplazadas según `recurrencia`.
	 */
	public siguienteOcurrencia(hoy: string): Tarea | null {
		const { recurrencia } = this.datos;
		if (!recurrencia) return null;
		const sinFechas =
			this.datos.fechaInicio === null && this.datos.fechaVencimiento === null;
		const fechaInicio = this.datos.fechaInicio
			? avanzarDia(this.datos.fechaInicio, recurrencia)
			: null;
		const fechaVencimiento = this.datos.fechaVencimiento
			? avanzarDia(this.datos.fechaVencimiento, recurrencia)
			: sinFechas
				? avanzarDia(hoy, recurrencia)
				: null;

		return new Tarea(
			new EntityId(),
			this.usuarioId,
			{
				...this.getDatos(),
				estado: "pendiente",
				fechaInicio,
				fechaVencimiento,
				dependeDeId: null,
				subtareas: this.datos.subtareas.map((sub) => ({
					titulo: sub.titulo,
					completada: false,
				})),
			},
			{ ...this.ubicacion },
			[...this.responsableIds],
			[],
			false,
			{ ...this.asignadoPor },
		);
	}

	/** `undefined` deja el campo como está; `null` vacía una fecha o el color. */
	public actualizar(cambios: Partial<DatosTarea>): void {
		const previos = this.datos;
		const anterior = this.datos.estado;
		this.datos = Tarea.validar({ ...this.datos, ...sinIndefinidos(cambios) });
		const campos = CAMPOS_HISTORIAL.filter(
			(campo) => previos[campo] !== this.datos[campo],
		);
		if (campos.length > 0 && this.id.isPersisted()) {
			this.addDomainEvent(
				new TareaActualizadaEvent({
					tareaId: this.getId(),
					cambios: Object.fromEntries(
						campos.map((campo) => [
							campo,
							{ anterior: previos[campo], nuevo: this.datos[campo] },
						]),
					),
				}),
			);
		}
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
		const subtareas = datos.subtareas.map((sub) => {
			const titulo = sub.titulo.trim();
			if (titulo.length === 0) {
				throw new TareaInvalidaError(
					"El título de cada subtarea es obligatorio",
				);
			}
			return {
				...(sub.id !== undefined ? { id: sub.id } : {}),
				titulo,
				completada: sub.completada,
			};
		});
		return { ...datos, tagIds: [...new Set(datos.tagIds)], subtareas };
	}
}

/** Desplaza un día ISO (`AAAA-MM-DD`) según la recurrencia; en mensual acota al fin de mes. */
export function avanzarDia(dia: string, recurrencia: RecurrenciaTarea): string {
	const [anio = 1970, mes = 1, fecha = 1] = dia.split("-").map(Number);
	if (recurrencia === "diaria") {
		return aIsoUtc(Date.UTC(anio, mes - 1, fecha + 1));
	}
	if (recurrencia === "semanal") {
		return aIsoUtc(Date.UTC(anio, mes - 1, fecha + 7));
	}
	const ultimoDiaMesSiguiente = new Date(
		Date.UTC(anio, mes + 1, 0),
	).getUTCDate();
	return aIsoUtc(Date.UTC(anio, mes, Math.min(fecha, ultimoDiaMesSiguiente)));
}

const aIsoUtc = (ms: number) => new Date(ms).toISOString().slice(0, 10);

const CAMPOS_HISTORIAL: CampoHistorial[] = [
	"titulo",
	"prioridad",
	"fechaInicio",
	"fechaVencimiento",
];

function sinIndefinidos<T extends object>(objeto: T): Partial<T> {
	return Object.fromEntries(
		Object.entries(objeto).filter(([, valor]) => valor !== undefined),
	) as Partial<T>;
}
