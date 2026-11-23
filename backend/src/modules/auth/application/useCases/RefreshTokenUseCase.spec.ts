import { describe, expect, it, mock, beforeEach } from "bun:test";
import { RefreshTokenUseCase } from "./RefreshTokenUseCase";
import { EmisorSesion } from "../services/EmisorSesion";
import { Usuario } from "@/core/usuario";

const mockTokenService = {
	generarToken: mock(() => "access"),
	generarRefreshToken: mock(() => "new_refresh"),
	hashearRefreshToken: mock(() => "hash"),
};

const mockRefreshTokenRepo = {
	crear: mock(),
	buscarValidoPorHash: mock(),
	caducarEn: mock(),
	revocarTodosPorUsuarioId: mock(),
};

const mockUsuarioRepository = {
	buscarPorId: mock(),
};

describe("RefreshTokenUseCase", () => {
	let useCase: RefreshTokenUseCase;

	beforeEach(() => {
		for (const fn of Object.values(mockRefreshTokenRepo)) fn.mockReset();
		mockUsuarioRepository.buscarPorId.mockReset();
		mockRefreshTokenRepo.buscarValidoPorHash.mockResolvedValue({
			id: 1,
			usuarioId: 5,
			expiraEn: new Date(Date.now() + 60_000),
		});
		useCase = new RefreshTokenUseCase(
			mockTokenService as never,
			mockRefreshTokenRepo as never,
			mockUsuarioRepository as never,
			new EmisorSesion(
				mockTokenService as never,
				mockRefreshTokenRepo as never,
			),
		);
	});

	const ana = (activo = true) =>
		Usuario.reconstituir("Ana", "a@x.com", "hash", activo, 5, ["USUARIO"]);

	it("debería emitir un par nuevo y dejar el token usado con un margen corto", async () => {
		mockUsuarioRepository.buscarPorId.mockResolvedValue(ana());

		const resultado = await useCase.ejecutar("refresh");

		expect(resultado.refreshToken).toBe("new_refresh");
		expect(mockRefreshTokenRepo.crear).toHaveBeenCalledTimes(1);
		const [id, fecha] = mockRefreshTokenRepo.caducarEn.mock.calls[0] as [
			number,
			Date,
		];
		expect(id).toBe(1);
		expect(fecha.getTime() - Date.now()).toBeLessThanOrEqual(120_000);
	});

	it("debería rechazar un token inválido sin cerrar las demás sesiones", async () => {
		mockRefreshTokenRepo.buscarValidoPorHash.mockResolvedValue(null);

		expect(useCase.ejecutar("refresh")).rejects.toThrow(
			"Refresh token inválido o expirado",
		);
		expect(mockRefreshTokenRepo.crear).not.toHaveBeenCalled();
		expect(
			mockRefreshTokenRepo.revocarTodosPorUsuarioId,
		).not.toHaveBeenCalled();
	});

	it("debería rechazar a un usuario desactivado", async () => {
		mockUsuarioRepository.buscarPorId.mockResolvedValue(ana(false));

		expect(useCase.ejecutar("refresh")).rejects.toThrow("inactivo");
		expect(mockRefreshTokenRepo.crear).not.toHaveBeenCalled();
		expect(mockRefreshTokenRepo.caducarEn).not.toHaveBeenCalled();
	});

	it("debería compartir la rotación si llegan dos peticiones concurrentes con el mismo token", async () => {
		mockUsuarioRepository.buscarPorId.mockResolvedValue(ana());

		const [primera, segunda] = await Promise.all([
			useCase.ejecutar("refresh"),
			useCase.ejecutar("refresh"),
		]);

		expect(primera).toEqual(segunda);
		expect(mockRefreshTokenRepo.crear).toHaveBeenCalledTimes(1);
	});
});
