import { Entity } from "@/core/shared/domain/Entity";
import { EntityId } from "@/core/shared/domain/EntityId";

export interface DatosNota {
	titulo: string;
	/** Markdown. */
	contenido: string;
	/** Personal: tags del dueño; de proyecto: de la organización (RN-60). */
	tagIds: number[];
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

	private constructor(
		id: EntityId,
		usuarioId: number,
		datos: DatosNota,
		updatedAt: Date | null,
		proyecto: ProyectoNota | null,
	) {
		super(id);
		this.usuarioId = usuarioId;
		this.proyecto = proyecto;
		this.datos = { ...datos, tagIds: [...new Set(datos.tagIds)] };
		this.updatedAt = updatedAt;
	}

	/** Sin `proyecto`, personal. */
	public static crear(
		usuarioId: number,
		datos: { titulo: string; contenido?: string; tagIds?: number[] },
		proyecto: ProyectoNota | null = null,
	): Nota {
		return new Nota(
			new EntityId(),
			usuarioId,
			{
				titulo: datos.titulo,
				contenido: datos.contenido ?? "",
				tagIds: datos.tagIds ?? [],
			},
			null,
			proyecto,
		);
	}

	public static reconstituir(
		id: number,
		usuarioId: number,
		datos: DatosNota,
		updatedAt: Date,
		proyecto: ProyectoNota | null = null,
	): Nota {
		return new Nota(new EntityId(id), usuarioId, datos, updatedAt, proyecto);
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

	/** `undefined` deja el campo como está. */
	public actualizar(cambios: Partial<DatosNota>): void {
		this.datos = {
			titulo: cambios.titulo ?? this.datos.titulo,
			contenido: cambios.contenido ?? this.datos.contenido,
			tagIds: [...new Set(cambios.tagIds ?? this.datos.tagIds)],
		};
	}
}
