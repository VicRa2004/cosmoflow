import { BaseError } from "@/core/shared/domain/error/BaseError";
import type { Almacenamiento } from "@/core/shared/domain/Almacenamiento";
import type { EventBus } from "@/core/shared/domain/events/EventBus";
import type { UnitOfWork } from "@/core/shared/domain/UnitOfWork";
import {
	type PasswordHasher,
	UsuarioNoEncontradoError,
	type UsuarioRepository,
} from "@/core/usuario";
import { CuentaEliminadaEvent } from "../../domain/event/CuentaEliminadaEvent";
import type { DatosCuentaRepository } from "../../domain/repository/DatosCuentaRepository";

/**
 * Baja voluntaria confirmada con la contraseña. No se permite mientras sea el
 * único administrador de una organización: dejaría a sus miembros sin nadie que
 * la gestione.
 */
export class EliminarCuentaUseCase {
	constructor(
		private readonly usuarioRepository: UsuarioRepository,
		private readonly passwordHasher: PasswordHasher,
		private readonly datosCuenta: DatosCuentaRepository,
		private readonly almacenamiento: Almacenamiento,
		private readonly eventBus: EventBus,
		private readonly uow: UnitOfWork,
	) {}

	async ejecutar(usuarioId: number, password: string): Promise<void> {
		const usuario = await this.usuarioRepository.buscarPorId(usuarioId);
		if (!usuario) throw new UsuarioNoEncontradoError();

		const isValida = await this.passwordHasher.comparar(
			password,
			usuario.getPasswordHash(),
		);
		if (!isValida) throw new BaseError("La contraseña no es correcta", 400);

		const organizaciones =
			await this.datosCuenta.organizacionesSinOtroAdmin(usuarioId);
		if (organizaciones.length > 0) {
			throw new BaseError(
				`Eres el único administrador de: ${organizaciones.join(", ")}. Nombra otro administrador o elimina la organización antes de eliminar tu cuenta.`,
				409,
			);
		}

		const archivos = await this.uow.ejecutar(async () => {
			const claves = await this.datosCuenta.darDeBaja(usuarioId);
			await this.eventBus.publish(new CuentaEliminadaEvent({ usuarioId }));
			return claves;
		});
		// Tras confirmar la baja: un archivo que no se pueda borrar no la deshace.
		await Promise.allSettled(
			archivos.map((clave) => this.almacenamiento.eliminar(clave)),
		);
	}
}
