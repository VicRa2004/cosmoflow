import { BaseError } from "@/core/shared/domain/error/BaseError";

export class SinPermisoDelegadosError extends BaseError {
	constructor() {
		super(
			"Solo el líder o quien tenga equipos:editar elige a los delegados",
			403,
		);
	}
}
