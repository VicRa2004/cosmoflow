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
	) {
		super(id);
	}

	public static crear(dueno: DuenoTag, nombre: string): Tag {
		return new Tag(new EntityId(), dueno, nombre);
	}

	public static reconstituir(id: number, dueno: DuenoTag, nombre: string): Tag {
		return new Tag(new EntityId(id), dueno, nombre);
	}

	getDueno() {
		return this.dueno;
	}

	getNombre() {
		return this.nombre;
	}

	public actualizar(cambios: { nombre?: string }): void {
		if (cambios.nombre !== undefined) this.nombre = cambios.nombre;
	}
}
