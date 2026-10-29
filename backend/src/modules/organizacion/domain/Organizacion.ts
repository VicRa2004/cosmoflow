import { Entity } from "@/core/shared/domain/Entity";
import { EntityId } from "@/core/shared/domain/EntityId";

interface DatosOrganizacion {
	nombre: string;
	descripcion: string;
	/** Hex `#rrggbb` (RN-15). */
	color: string;
	/** Clave en el almacenamiento; sin ella se muestran las iniciales. */
	avatar: string | null;
}

/** Espacio de trabajo compartido (RN-13). */
export class Organizacion extends Entity {
	private datos: DatosOrganizacion;

	private constructor(id: EntityId, datos: DatosOrganizacion) {
		super(id);
		this.datos = datos;
	}

	public static crear(datos: Omit<DatosOrganizacion, "avatar">): Organizacion {
		return new Organizacion(new EntityId(), { ...datos, avatar: null });
	}

	public static reconstituir(
		id: number,
		datos: DatosOrganizacion,
	): Organizacion {
		return new Organizacion(new EntityId(id), datos);
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

	getAvatar() {
		return this.datos.avatar;
	}

	public actualizar(cambios: Partial<Omit<DatosOrganizacion, "avatar">>): void {
		this.datos = {
			nombre: cambios.nombre ?? this.datos.nombre,
			descripcion: cambios.descripcion ?? this.datos.descripcion,
			color: cambios.color ?? this.datos.color,
			avatar: this.datos.avatar,
		};
	}

	public cambiarAvatar(clave: string | null): void {
		this.datos.avatar = clave;
	}
}
