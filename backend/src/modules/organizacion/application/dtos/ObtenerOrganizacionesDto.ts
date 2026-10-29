export interface ObtenerOrganizacionesDto {
	pagina: number;
	limite: number;
	nombre?: string;
	orden?: "nombre" | "recientes";
}
