import { Entity } from "@/core/shared/domain/Entity";
import { EntityId } from "@/core/shared/domain/EntityId";
import { EquipoInvalidoError } from "./error/EquipoInvalidoError";

export interface MiembroDeEquipo {
	usuarioId: number;
	/** Delegado del líder (RN-22). */
	puedeCrearTareas: boolean;
}

interface DatosEquipo {
	nombre: string;
	descripcion: string;
	/** Hex `#rrggbb` (RN-25). */
	color: string;
	liderId: number | null;
	miembros: MiembroDeEquipo[];
	tagIds: number[];
}

export interface CambiosEquipo {
	nombre?: string;
	descripcion?: string;
	color?: string;
	/** `null` quita el líder; sin el campo, se mantiene. */
	liderId?: number | null;
	miembroIds?: number[];
	tagIds?: number[];
}

const MINIMO_MIEMBROS = 2;

/** Grupo de una organización (RN-20): al menos 2 miembros y un líder opcional entre ellos. */
export class Equipo extends Entity {
	private datos: DatosEquipo;

	private constructor(
		id: EntityId,
		private readonly organizacionId: number,
		datos: DatosEquipo,
	) {
		super(id);
		this.datos = datos;
	}

	public static crear(
		organizacionId: number,
		datos: Required<CambiosEquipo>,
	): Equipo {
		const equipo = new Equipo(new EntityId(), organizacionId, {
			nombre: datos.nombre,
			descripcion: datos.descripcion,
			color: datos.color,
			liderId: datos.liderId,
			miembros: [],
			tagIds: [],
		});
		equipo.actualizar(datos);
		return equipo;
	}

	public static reconstituir(
		id: number,
		organizacionId: number,
		datos: DatosEquipo,
	): Equipo {
		return new Equipo(new EntityId(id), organizacionId, datos);
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

	getColor() {
		return this.datos.color;
	}

	getLiderId() {
		return this.datos.liderId;
	}

	getMiembros(): readonly MiembroDeEquipo[] {
		return this.datos.miembros;
	}

	getTagIds(): readonly number[] {
		return this.datos.tagIds;
	}

	/** Quienes siguen en el equipo conservan si eran delegados. */
	public actualizar(cambios: CambiosEquipo): void {
		const miembros =
			cambios.miembroIds === undefined
				? this.datos.miembros
				: [...new Set(cambios.miembroIds)].map((usuarioId) => ({
						usuarioId,
						puedeCrearTareas:
							this.datos.miembros.find((m) => m.usuarioId === usuarioId)
								?.puedeCrearTareas ?? false,
					}));
		// RN-20 y RN-26: quitar miembros nunca deja el equipo por debajo de 2.
		if (miembros.length < MINIMO_MIEMBROS) {
			throw new EquipoInvalidoError("Un equipo necesita al menos 2 miembros");
		}
		const liderId =
			cambios.liderId === undefined ? this.datos.liderId : cambios.liderId;
		if (liderId !== null && !miembros.some((m) => m.usuarioId === liderId)) {
			throw new EquipoInvalidoError("El líder debe ser miembro del equipo");
		}
		this.datos = {
			nombre: cambios.nombre ?? this.datos.nombre,
			descripcion: cambios.descripcion ?? this.datos.descripcion,
			color: cambios.color ?? this.datos.color,
			liderId,
			miembros,
			tagIds:
				cambios.tagIds === undefined
					? this.datos.tagIds
					: [...new Set(cambios.tagIds)],
		};
	}

	/** El líder elige quién crea y asigna tareas además de él (RN-22). */
	public cambiarDelegados(usuarioIds: number[]): void {
		if (
			usuarioIds.some(
				(id) => !this.datos.miembros.some((m) => m.usuarioId === id),
			)
		) {
			throw new EquipoInvalidoError(
				"Los delegados deben ser miembros del equipo",
			);
		}
		this.datos.miembros = this.datos.miembros.map((m) => ({
			...m,
			puedeCrearTareas: usuarioIds.includes(m.usuarioId),
		}));
	}

	/** RN-22: sin líder, cualquier miembro; con líder, él y sus delegados. */
	public puedeCrearTareas(usuarioId: number): boolean {
		const miembro = this.datos.miembros.find((m) => m.usuarioId === usuarioId);
		if (!miembro) return false;
		if (this.datos.liderId === null) return true;
		return this.datos.liderId === usuarioId || miembro.puedeCrearTareas;
	}
}
