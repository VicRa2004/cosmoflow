import { Entity } from "@/core/shared/domain/Entity";
import { EntityId } from "@/core/shared/domain/EntityId";
import type { PermisoOrganizacion } from "./permisosOrganizacion";

/** Rol personalizado de una organización (RN-14): nombre y permisos del catálogo. */
export class RolOrganizacion extends Entity {
	private constructor(
		id: EntityId,
		private readonly organizacionId: number,
		private nombre: string,
		private permisos: PermisoOrganizacion[],
	) {
		super(id);
	}

	public static crear(
		organizacionId: number,
		nombre: string,
		permisos: PermisoOrganizacion[],
	): RolOrganizacion {
		return new RolOrganizacion(new EntityId(), organizacionId, nombre, [
			...new Set(permisos),
		]);
	}

	public static reconstituir(
		id: number,
		organizacionId: number,
		nombre: string,
		permisos: PermisoOrganizacion[],
	): RolOrganizacion {
		return new RolOrganizacion(
			new EntityId(id),
			organizacionId,
			nombre,
			permisos,
		);
	}

	getOrganizacionId() {
		return this.organizacionId;
	}

	getNombre() {
		return this.nombre;
	}

	getPermisos() {
		return this.permisos;
	}

	public actualizar(cambios: {
		nombre?: string;
		permisos?: PermisoOrganizacion[];
	}): void {
		if (cambios.nombre !== undefined) this.nombre = cambios.nombre;
		if (cambios.permisos !== undefined) {
			this.permisos = [...new Set(cambios.permisos)];
		}
	}
}
