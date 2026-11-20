import { BaseError } from "@/core/shared/domain/error/BaseError";

export class SinPermisoComentarioError extends BaseError {
	constructor(accion: "editar" | "eliminar") {
		super(
			accion === "editar"
				? "Solo su autor puede editar un comentario"
				: "Solo su autor o quien gestiona las tareas de ahí puede eliminar un comentario",
			403,
		);
	}
}
