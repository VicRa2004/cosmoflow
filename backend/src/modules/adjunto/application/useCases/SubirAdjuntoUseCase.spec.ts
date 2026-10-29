import { describe, expect, it, mock } from "bun:test";
import { AdjuntoInvalidoError } from "../../domain/error/AdjuntoInvalidoError";
import { ADJUNTO_MAX_BYTES, SubirAdjuntoUseCase } from "./SubirAdjuntoUseCase";

const PNG = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 1]);

function preparar(
	crear = mock(async (datos: object) => ({ id: 12, ...datos })),
) {
	const almacenamiento = {
		guardar: mock(async () => {}),
		obtener: mock(async () => null),
		eliminar: mock(async () => {}),
	};
	const useCase = new SubirAdjuntoUseCase(
		{ crear } as never,
		almacenamiento as never,
	);
	return { useCase, almacenamiento, crear };
}

describe("SubirAdjuntoUseCase", () => {
	it("debería guardar la imagen con una clave del usuario y devolver su URL", async () => {
		const { useCase, almacenamiento, crear } = preparar();

		const dto = await useCase.ejecutar(7, PNG);

		expect(dto).toEqual({
			id: 12,
			url: "/api/adjuntos/12",
			tipo: "image/png",
			bytes: PNG.byteLength,
		});
		const [clave] = almacenamiento.guardar.mock.calls[0] as unknown as [string];
		expect(clave).toMatch(/^adjuntos\/7\/[\w-]+\.png$/);
		expect(crear).toHaveBeenCalledWith(expect.objectContaining({ clave }));
	});

	it("debería rechazar lo que no es PNG, JPEG ni WebP", async () => {
		const { useCase, almacenamiento } = preparar();

		await expect(
			useCase.ejecutar(7, new TextEncoder().encode("<svg>")),
		).rejects.toThrow(AdjuntoInvalidoError);
		expect(almacenamiento.guardar).not.toHaveBeenCalled();
	});

	it("debería rechazar imágenes de más de 5 MB", async () => {
		const { useCase } = preparar();
		const grande = new Uint8Array(ADJUNTO_MAX_BYTES + 1);
		grande.set(PNG);

		await expect(useCase.ejecutar(7, grande)).rejects.toThrow(
			AdjuntoInvalidoError,
		);
	});

	it("debería borrar el archivo si falla el guardado en BD", async () => {
		const { useCase, almacenamiento } = preparar(
			mock(async () => {
				throw new Error("BD caída");
			}),
		);

		await expect(useCase.ejecutar(7, PNG)).rejects.toThrow("BD caída");
		expect(almacenamiento.eliminar).toHaveBeenCalledTimes(1);
	});
});
