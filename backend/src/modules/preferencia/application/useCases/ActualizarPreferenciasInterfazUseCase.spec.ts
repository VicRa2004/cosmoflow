import { describe, expect, it, mock } from "bun:test";
import { PREFERENCIAS_PREDETERMINADAS } from "../../domain/PreferenciasInterfaz";
import { ActualizarPreferenciasInterfazUseCase } from "./ActualizarPreferenciasInterfazUseCase";
import { ObtenerPreferenciasInterfazUseCase } from "./ObtenerPreferenciasInterfazUseCase";

describe("ActualizarPreferenciasInterfazUseCase", () => {
	it("mezcla lo enviado con lo guardado y las predeterminadas", async () => {
		const repo = {
			obtener: mock(async () => ({ markdownFuente: "serif" as const })),
			guardar: mock(async () => {}),
		};
		const useCase = new ActualizarPreferenciasInterfazUseCase(
			repo,
			new ObtenerPreferenciasInterfazUseCase(repo),
		);

		const resultado = await useCase.ejecutar(7, { pendientesNotas: true });

		const esperado = {
			...PREFERENCIAS_PREDETERMINADAS,
			markdownFuente: "serif",
			pendientesNotas: true,
		};
		expect(resultado).toEqual(esperado);
		expect(repo.guardar).toHaveBeenCalledWith(7, esperado);
	});
});
