import { Entity } from "@/core/shared/domain/Entity";
import { EntityId } from "@/core/shared/domain/EntityId";

/** Tag personal (RN-60): solo lo ve y usa su dueño. */
export class Tag extends Entity {
	private readonly usuarioId: number;
	private nombre: string;

	private constructor(id: EntityId, usuarioId: number, nombre: string) {
		super(id);
		this.usuarioId = usuarioId;
		this.nombre = nombre;
	}

	public static crear(usuarioId: number, nombre: string): Tag {
		return new Tag(new EntityId(), usuarioId, nombre);
	}

	public static reconstituir(
		id: number,
		usuarioId: number,
		nombre: string,
	): Tag {
		return new Tag(new EntityId(id), usuarioId, nombre);
	}

	getUsuarioId() {
		return this.usuarioId;
	}

	getNombre() {
		return this.nombre;
	}

	public actualizar(cambios: { nombre?: string }): void {
		if (cambios.nombre !== undefined) this.nombre = cambios.nombre;
	}
}
