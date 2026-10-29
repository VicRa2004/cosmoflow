import { Entity } from "@/core/shared/domain/Entity";
import { EntityId } from "@/core/shared/domain/EntityId";

export interface DatosNota {
	titulo: string;
	/** Markdown. */
	contenido: string;
	/** Tags personales del dueño (RN-60). */
	tagIds: number[];
}

/** Nota personal (RN-50): solo la ve su dueño. */
export class Nota extends Entity {
	private readonly usuarioId: number;
	private datos: DatosNota;
	/** Última edición; `null` en una nota sin guardar. */
	private readonly updatedAt: Date | null;

	private constructor(
		id: EntityId,
		usuarioId: number,
		datos: DatosNota,
		updatedAt: Date | null,
	) {
		super(id);
		this.usuarioId = usuarioId;
		this.datos = { ...datos, tagIds: [...new Set(datos.tagIds)] };
		this.updatedAt = updatedAt;
	}

	public static crear(
		usuarioId: number,
		datos: { titulo: string; contenido?: string; tagIds?: number[] },
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
		);
	}

	public static reconstituir(
		id: number,
		usuarioId: number,
		datos: DatosNota,
		updatedAt: Date,
	): Nota {
		return new Nota(new EntityId(id), usuarioId, datos, updatedAt);
	}

	getUsuarioId() {
		return this.usuarioId;
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
