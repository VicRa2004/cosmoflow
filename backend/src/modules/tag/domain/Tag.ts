import { Entity } from "@/core/shared/domain/Entity";
import { EntityId } from "@/core/shared/domain/EntityId";

/** De quién es un tag (RN-60): de un usuario o de una organización, nunca de los dos. */
export type DuenoTag = { usuarioId: number } | { organizacionId: number };

/** Etiqueta reutilizable; solo la ve y usa su dueño. */
export class Tag extends Entity {
	private constructor(
		id: EntityId,
		private readonly dueno: DuenoTag,
		private nombre: string,
		private color: string | null = null,
	) {
		super(id);
	}

	public static crear(
		dueno: DuenoTag,
		nombre: string,
		color: string | null = null,
	): Tag {
		return new Tag(new EntityId(), dueno, nombre, color);
	}

	public static reconstituir(
		id: number,
		dueno: DuenoTag,
		nombre: string,
		color: string | null = null,
	): Tag {
		return new Tag(new EntityId(id), dueno, nombre, color);
	}

	getDueno() {
		return this.dueno;
	}

	getNombre() {
		return this.nombre;
	}

	getColor() {
		return this.color;
	}

	/** `undefined` deja el campo como está; `color: null` lo quita. */
	public actualizar(cambios: { nombre?: string; color?: string | null }): void {
		if (cambios.nombre !== undefined) this.nombre = cambios.nombre;
		if (cambios.color !== undefined) this.color = cambios.color;
	}
}
