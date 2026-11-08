import type { UnitOfWork } from "@/core/shared/domain/UnitOfWork";
import { CarpetaNota } from "../../domain/CarpetaNota";
import { CarpetaInvalidaError } from "../../domain/error/CarpetaInvalidaError";
import { Nota } from "../../domain/Nota";
import type { CarpetaNotaRepository } from "../../domain/repository/CarpetaNotaRepository";
import type { NotaRepository } from "../../domain/repository/NotaRepository";
import type {
	ImportarNotasDto,
	ResultadoImportacionDto,
} from "../dtos/ImportarNotasDto";
import type { ProyectosNota } from "../services/ProyectosNota";

/**
 * Importa un vault (o parte) de Obsidian: reutiliza las carpetas que ya existen
 * con el mismo nombre en el mismo sitio y crea las que falten. Todo o nada.
 */
export class ImportarNotasUseCase {
	constructor(
		private readonly notaRepository: NotaRepository,
		private readonly carpetaRepository: CarpetaNotaRepository,
		private readonly proyectos: ProyectosNota,
		private readonly uow: UnitOfWork,
	) {}

	async ejecutar(
		usuarioId: number,
		{ proyectoId, carpetaId, notas }: ImportarNotasDto,
	): Promise<ResultadoImportacionDto> {
		const proyecto = proyectoId
			? await this.proyectos.exigir(usuarioId, proyectoId)
			: null;
		const ambito = proyectoId ? { proyectoId } : { usuarioId };

		return this.uow.ejecutar(async () => {
			const existentes = await this.carpetaRepository.buscar(ambito);
			// `padreId/nombre` → id; la raíz es `null`.
			const ids = new Map(
				existentes.map((c) => {
					const { padreId, nombre } = c.getDatos();
					return [`${padreId}/${nombre}`, c.getId()];
				}),
			);
			const destino = carpetaId ?? null;
			if (destino !== null && !existentes.some((c) => c.getId() === destino)) {
				throw new CarpetaInvalidaError();
			}

			let creadas = 0;
			for (const { carpeta: ruta, titulo, contenido } of notas) {
				let padreId = destino;
				for (const nombre of ruta) {
					const clave = `${padreId}/${nombre}`;
					let id = ids.get(clave);
					if (id === undefined) {
						id = (
							await this.carpetaRepository.crear(
								CarpetaNota.crear(usuarioId, { nombre, padreId }, proyecto),
							)
						).getId();
						ids.set(clave, id);
						creadas++;
					}
					padreId = id;
				}
				await this.notaRepository.crear(
					Nota.crear(
						usuarioId,
						{ titulo, contenido, carpetaId: padreId },
						proyecto,
					),
				);
			}
			return { notas: notas.length, carpetas: creadas };
		});
	}
}
