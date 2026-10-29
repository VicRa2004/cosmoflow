import { Entity } from "@/core/shared/domain/Entity";
import { EntityId } from "@/core/shared/domain/EntityId";
import { ProyectoInvalidoError } from "./error/ProyectoInvalidoError";

export const ESTADOS_PROYECTO = ["activo", "en_pausa", "terminado"] as const;
export type EstadoProyecto = (typeof ESTADOS_PROYECTO)[number];

interface DatosProyecto {
	nombre: string;
	descripcion: string;
	estado: EstadoProyecto;
	equipoIds: number[];
	/** Integrantes sueltos, además de los equipos (RN-32). */
	integranteIds: number[];
}

export type CambiosProyecto = Partial<DatosProyecto>;

/** Trabajo de una organización (RN-30) con al menos un equipo (RN-31). */
export class Proyecto extends Entity {
	private datos: DatosProyecto;

	private constructor(
		id: EntityId,
		private readonly organizacionId: number,
		datos: DatosProyecto,
	) {
		super(id);
		this.datos = datos;
	}

	public static crear(organizacionId: number, datos: DatosProyecto): Proyecto {
		const proyecto = new Proyecto(new EntityId(), organizacionId, datos);
		proyecto.actualizar(datos);
		return proyecto;
	}

	public static reconstituir(
		id: number,
		organizacionId: number,
		datos: DatosProyecto,
	): Proyecto {
		return new Proyecto(new EntityId(id), organizacionId, datos);
	}

	getOrganizacionId() {
		return this.organizacionId;
	}

	getNombre() {
		return this.datos.nombre;
	}

	getDescripcion() {
		return this.datos.descripcion;
	}

	getEstado() {
		return this.datos.estado;
	}

	getEquipoIds(): readonly number[] {
		return this.datos.equipoIds;
	}

	getIntegranteIds(): readonly number[] {
		return this.datos.integranteIds;
	}

	public actualizar(cambios: CambiosProyecto): void {
		const equipoIds = [...new Set(cambios.equipoIds ?? this.datos.equipoIds)];
		if (equipoIds.length === 0) {
			throw new ProyectoInvalidoError(
				"Un proyecto necesita al menos un equipo",
			);
		}
		this.datos = {
			nombre: cambios.nombre ?? this.datos.nombre,
			descripcion: cambios.descripcion ?? this.datos.descripcion,
			estado: cambios.estado ?? this.datos.estado,
			equipoIds,
			integranteIds: [
				...new Set(cambios.integranteIds ?? this.datos.integranteIds),
			],
		};
	}
}
