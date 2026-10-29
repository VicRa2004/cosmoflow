export interface OrganizacionDto {
	id: number;
	nombre: string;
	descripcion: string;
	color: string;
	avatarUrl: string | null;
	/** Si quien pide es el administrador (RN-11). */
	isAdmin: boolean;
	/** Lo que quien pide puede hacer aquí (RN-17): la interfaz oculta lo demás. */
	permisos: string[];
}
