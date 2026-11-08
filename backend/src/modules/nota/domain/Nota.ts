import { Entity } from "@/core/shared/domain/Entity";
import { EntityId } from "@/core/shared/domain/EntityId";

export interface DatosNota {
	titulo: string;
	/** Markdown. */
	contenido: string;
	/** Color de acento (#rrggbb) o `null`. */
	color: string | null;
	/** Personal: tags del dueño; de proyecto: de la organización (RN-60). */
	tagIds: number[];
	/** Carpeta del mismo ámbito, o `null` en la raíz. */
	carpetaId: number | null;
}

export interface ProyectoNota {
	organizacionId: number;
	proyectoId: number;
}

/** Personal (RN-50: solo la ve su dueño) o de un proyecto (RN-33: sus miembros). */
export class Nota extends Entity {
	private readonly usuarioId: number;
	private datos: DatosNota;
	private readonly proyecto: ProyectoNota | null;
	/** Última edición; `null` en una nota sin guardar. */
	private readonly updatedAt: Date | null;
	private readonly createdAt: Date | null;

	private constructor(
		id: EntityId,
		usuarioId: number,
		datos: DatosNota,
		updatedAt: Date | null,
		proyecto: ProyectoNota | null,
		createdAt: Date | null,
	) {
		super(id);
		this.usuarioId = usuarioId;
		this.proyecto = proyecto;
		this.datos = { ...datos, tagIds: [...new Set(datos.tagIds)] };
		this.updatedAt = updatedAt;
		this.createdAt = createdAt;
	}

	/** Sin `proyecto`, personal. */
	public static crear(
		usuarioId: number,
		datos: {
			titulo: string;
			contenido?: string;
			color?: string | null;
			tagIds?: number[];
			carpetaId?: number | null;
		},
		proyecto: ProyectoNota | null = null,
	): Nota {
		return new Nota(
			new EntityId(),
			usuarioId,
			{
				titulo: datos.titulo,
				contenido: datos.contenido ?? "",
				color: datos.color ?? null,
				tagIds: datos.tagIds ?? [],
				carpetaId: datos.carpetaId ?? null,
			},
			null,
			proyecto,
			null,
		);
	}

	public static reconstituir(
		id: number,
		usuarioId: number,
		datos: DatosNota,
		updatedAt: Date,
		proyecto: ProyectoNota | null = null,
		createdAt: Date = updatedAt,
	): Nota {
		return new Nota(
			new EntityId(id),
			usuarioId,
			datos,
			updatedAt,
			proyecto,
			createdAt,
		);
	}

	/** Quien la creó; en las personales, su dueño. */
	getUsuarioId() {
		return this.usuarioId;
	}

	getProyecto(): ProyectoNota | null {
		return this.proyecto && { ...this.proyecto };
	}

	getDatos(): DatosNota {
		return { ...this.datos, tagIds: [...this.datos.tagIds] };
	}

	getUpdatedAt() {
		return this.updatedAt;
	}

	getCreatedAt() {
		return this.createdAt;
	}

	/** `undefined` deja el campo como está; `color: null` lo quita y `carpetaId: null` la saca a la raíz. */
	public actualizar(cambios: Partial<DatosNota>): void {
		this.datos = {
			titulo: cambios.titulo ?? this.datos.titulo,
			contenido: cambios.contenido ?? this.datos.contenido,
			color: cambios.color === undefined ? this.datos.color : cambios.color,
			tagIds: [...new Set(cambios.tagIds ?? this.datos.tagIds)],
			carpetaId:
				cambios.carpetaId === undefined
					? this.datos.carpetaId
					: cambios.carpetaId,
		};
	}
}
