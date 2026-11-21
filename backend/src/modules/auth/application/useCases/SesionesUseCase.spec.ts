import { describe, expect, it, mock } from "bun:test";
import { SesionNoEncontradaError } from "../../domain/error/SesionNoEncontradaError";
import { ObtenerSesionesUseCase } from "./ObtenerSesionesUseCase";
import { RevocarSesionUseCase } from "./RevocarSesionUseCase";

const futuro = new Date(Date.now() + 86_400_000);
const pasado = new Date(Date.now() - 10_000);

const tokenService = {
	hashearRefreshToken: mock((t: string) => `hash_${t}`),
};

describe("ObtenerSesionesUseCase", () => {
	it("lista sesiones activas marcando isActual según el hash del refresh token", async () => {
		const creada = new Date("2026-11-20T10:00:00.000Z");
		const repo = {
			listarActivosPorUsuario: mock(async () => [
				{
					id: 1,
					tokenHash: "hash_actual",
					createdAt: creada,
					expiraEn: futuro,
				},
				{ id: 2, tokenHash: "hash_otra", createdAt: creada, expiraEn: futuro },
			]),
		};
		const useCase = new ObtenerSesionesUseCase(
			tokenService as never,
			repo as never,
		);

		const res = await useCase.ejecutar(5, "actual");

		expect(res).toEqual([
			{
				id: 1,
				createdAt: creada.toISOString(),
				expiraEn: futuro.toISOString(),
				isActual: true,
			},
			{
				id: 2,
				createdAt: creada.toISOString(),
				expiraEn: futuro.toISOString(),
				isActual: false,
			},
		]);
	});
});

describe("RevocarSesionUseCase", () => {
	it("revoca una sesión del usuario e indica si era la sesión actual", async () => {
		const repo = {
			buscarPorIdYUsuario: mock(async () => ({
				id: 1,
				tokenHash: "hash_actual",
				revocado: false,
				expiraEn: futuro,
			})),
			revocarPorId: mock(async () => true),
		};
		const useCase = new RevocarSesionUseCase(
			tokenService as never,
			repo as never,
		);

		const res = await useCase.ejecutar(5, 1, "actual");

		expect(res).toEqual({ isActual: true });
		expect(repo.revocarPorId).toHaveBeenCalledWith(1);
	});

	it("lanza SesionNoEncontradaError si pertenece a otro usuario, ya fue revocada o expiró", async () => {
		const repoAjena = {
			buscarPorIdYUsuario: mock(async () => null),
			revocarPorId: mock(),
		};
		const repoExpirada = {
			buscarPorIdYUsuario: mock(async () => ({
				id: 2,
				tokenHash: "hash_x",
				revocado: false,
				expiraEn: pasado,
			})),
			revocarPorId: mock(),
		};

		await expect(
			new RevocarSesionUseCase(
				tokenService as never,
				repoAjena as never,
			).ejecutar(5, 99),
		).rejects.toThrow(SesionNoEncontradaError);

		await expect(
			new RevocarSesionUseCase(
				tokenService as never,
				repoExpirada as never,
			).ejecutar(5, 2),
		).rejects.toThrow(SesionNoEncontradaError);
	});
});
