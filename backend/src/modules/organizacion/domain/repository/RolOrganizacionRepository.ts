import type { RolOrganizacion } from "../RolOrganizacion";

/** Todo acotado a `organizacionId` e ignorando los roles borrados. */
export interface RolOrganizacionRepository {
	/** Por nombre, con cuántos miembros lo tienen. */
	buscar: (
		organizacionId: number,
	) => Promise<{ rol: RolOrganizacion; totalMiembros: number }[]>;
	buscarPorId: (
		organizacionId: number,
		id: number,
	) => Promise<RolOrganizacion | null>;
	/** Sin distinguir mayúsculas. */
	buscarPorNombre: (
		organizacionId: number,
		nombre: string,
	) => Promise<RolOrganizacion | null>;
	contarMiembros: (rolId: number) => Promise<number>;
	/** `true` si todos son roles vivos de la organización. */
	sonRolesDe: (organizacionId: number, ids: number[]) => Promise<boolean>;
	crear: (data: RolOrganizacion) => Promise<RolOrganizacion>;
	actualizar: (data: RolOrganizacion) => Promise<RolOrganizacion>;
	/** Borrado lógico; quita el rol a quien lo tuviera. */
	eliminar: (organizacionId: number, id: number) => Promise<void>;
	/** Reemplaza los roles del miembro por `rolIds` (RN-14: varios por miembro). */
	asignar: (
		organizacionId: number,
		usuarioId: number,
		rolIds: number[],
	) => Promise<void>;
}
