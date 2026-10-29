import { Entity } from "@/core/shared/domain/Entity";
import { EntityId } from "@/core/shared/domain/EntityId";
import { TareaInvalidaError } from "./error/TareaInvalidaError";

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
	/** Tags personales del dueño (RN-60). */
	tagIds: number[];
}

/** Tarea personal (RN-40): de su dueño, sin equipo ni proyecto. */
export class Tarea extends Entity {
	private readonly usuarioId: number;
	private datos: DatosTarea;

	private constructor(id: EntityId, usuarioId: number, datos: DatosTarea) {
		super(id);
		this.usuarioId = usuarioId;
		this.datos = Tarea.validar(datos);
	}

	public static crear(
		usuarioId: number,
		datos: Partial<DatosTarea> & { titulo: string },
	): Tarea {
		return new Tarea(new EntityId(), usuarioId, {
			contenido: "",
			estado: "pendiente",
			prioridad: "media",
			fechaInicio: null,
			fechaVencimiento: null,
			tagIds: [],
			...sinIndefinidos(datos),
			titulo: datos.titulo,
		});
	}

	public static reconstituir(
		id: number,
		usuarioId: number,
		datos: DatosTarea,
	): Tarea {
		return new Tarea(new EntityId(id), usuarioId, datos);
	}

	getUsuarioId() {
		return this.usuarioId;
	}

	getDatos(): DatosTarea {
		return { ...this.datos, tagIds: [...this.datos.tagIds] };
	}

	/** `undefined` deja el campo como está; `null` vacía una fecha. */
	public actualizar(cambios: Partial<DatosTarea>): void {
		this.datos = Tarea.validar({ ...this.datos, ...sinIndefinidos(cambios) });
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
