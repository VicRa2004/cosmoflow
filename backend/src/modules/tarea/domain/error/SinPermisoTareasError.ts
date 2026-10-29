import { BaseError } from "@/core/shared/domain/error/BaseError";

export class SinPermisoTareasError extends BaseError {
	constructor() {
		super(
			"En un equipo con líder solo él y sus delegados crean, asignan y eliminan tareas",
			403,
		);
	}
}
