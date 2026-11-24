import { beforeEach, describe, expect, it, mock } from "bun:test";
import { Usuario } from "@/core/usuario";
import { EliminarCuentaUseCase } from "./EliminarCuentaUseCase";

const usuarios = { buscarPorId: mock() };
const hasher = { comparar: mock() };
const datosCuenta = {
	organizacionesSinOtroAdmin: mock(async (): Promise<string[]> => []),
	darDeBaja: mock(async () => ["avatares/5.png", "adjuntos/a.png"]),
	exportar: mock(),
};
const almacenamiento = { eliminar: mock(async () => {}) };
const eventBus = { publish: mock(async () => {}) };
const uow = { ejecutar: <T>(trabajo: () => Promise<T>) => trabajo() };

const useCase = new EliminarCuentaUseCase(
	usuarios as never,
	hasher as never,
	datosCuenta as never,
	almacenamiento as never,
	eventBus as never,
	uow,
);

describe("EliminarCuentaUseCase", () => {
	beforeEach(() => {
		usuarios.buscarPorId.mockReset();
		usuarios.buscarPorId.mockResolvedValue(
			Usuario.reconstituir("Ana", "a@x.com", "hash", true, 5, ["USUARIO"]),
		);
		hasher.comparar.mockReset();
		hasher.comparar.mockResolvedValue(true);
		datosCuenta.organizacionesSinOtroAdmin.mockClear();
		datosCuenta.darDeBaja.mockClear();
		almacenamiento.eliminar.mockClear();
		eventBus.publish.mockClear();
	});

	it("debería dar de baja, publicar el evento y borrar los archivos", async () => {
		await useCase.ejecutar(5, "secreta");

		expect(datosCuenta.darDeBaja).toHaveBeenCalledWith(5);
		expect(eventBus.publish).toHaveBeenCalledWith(
			expect.objectContaining({
				eventName: "auth.cuentaEliminada",
				data: { usuarioId: 5 },
			}),
		);
		expect(almacenamiento.eliminar).toHaveBeenCalledTimes(2);
	});

	it("debería rechazar una contraseña incorrecta sin tocar nada", async () => {
		hasher.comparar.mockResolvedValue(false);

		await expect(useCase.ejecutar(5, "mala")).rejects.toMatchObject({
			code: 400,
		});
		expect(datosCuenta.darDeBaja).not.toHaveBeenCalled();
	});

	it("debería impedirlo siendo el único administrador de una organización", async () => {
		datosCuenta.organizacionesSinOtroAdmin.mockResolvedValueOnce(["Acme"]);

		await expect(useCase.ejecutar(5, "secreta")).rejects.toMatchObject({
			code: 409,
		});
		expect(datosCuenta.darDeBaja).not.toHaveBeenCalled();
	});

	it("no debería fallar si un archivo no se puede borrar", async () => {
		almacenamiento.eliminar.mockRejectedValueOnce(new Error("S3 caído"));

		await expect(useCase.ejecutar(5, "secreta")).resolves.toBeUndefined();
	});
});
