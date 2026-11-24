import type {
	DatosCuentaRepository,
	DatosExportados,
} from "../../domain/repository/DatosCuentaRepository";

export class ExportarDatosUseCase {
	constructor(private readonly datosCuenta: DatosCuentaRepository) {}

	ejecutar(usuarioId: number): Promise<DatosExportados> {
		return this.datosCuenta.exportar(usuarioId);
	}
}
