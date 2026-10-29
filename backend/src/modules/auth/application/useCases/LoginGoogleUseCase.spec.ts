import { beforeEach, describe, expect, it, mock } from "bun:test";
import { Usuario } from "@/core/usuario";
import { EmisorSesion } from "../services/EmisorSesion";
import { LoginGoogleUseCase } from "./LoginGoogleUseCase";

const perfil = { googleId: "g-1", email: "ana@x.com", nombre: "Ana" };

const usuario = (emailVerificado: boolean, isActivo = true) =>
	Usuario.reconstituir(
		"Ana",
		"ana@x.com",
		"hash",
		isActivo,
		5,
		["USUARIO"],
		emailVerificado,
	);

const google = {
	urlAutorizacion: mock(),
	obtenerPerfil: mock(async () => perfil),
};
const usuarios = {
	buscarPorId: mock(),
	buscarPorEmail: mock(),
	crear: mock(async (u: Usuario) =>
		Usuario.reconstituir(u.getNombre(), u.getEmail(), "hash", true, 9, []),
	),
	actualizar: mock(async (u: Usuario) => u),
};
const hasher = { hash: mock(async () => "hash-inutil"), comparar: mock() };
const cuentaRepo = {
	buscarUsuarioIdPorGoogleId: mock(async (): Promise<number | null> => null),
	vincularGoogle: mock(async () => {}),
};
const refreshTokenRepo = {
	crear: mock(async () => {}),
	revocarTodosPorUsuarioId: mock(async () => {}),
};
const tokenService = {
	generarToken: mock(() => "access"),
	generarRefreshToken: mock(() => "refresh"),
	hashearRefreshToken: mock(() => "refresh_hash"),
};

describe("LoginGoogleUseCase", () => {
	let useCase: LoginGoogleUseCase;

	beforeEach(() => {
		for (const m of [
			usuarios.buscarPorId,
			usuarios.buscarPorEmail,
			usuarios.crear,
			usuarios.actualizar,
			cuentaRepo.buscarUsuarioIdPorGoogleId,
			cuentaRepo.vincularGoogle,
			refreshTokenRepo.revocarTodosPorUsuarioId,
		]) {
			m.mockClear();
		}
		usuarios.buscarPorId.mockResolvedValue(null);
		usuarios.buscarPorEmail.mockResolvedValue(null);
		cuentaRepo.buscarUsuarioIdPorGoogleId.mockResolvedValue(null);
		useCase = new LoginGoogleUseCase(
			google as never,
			usuarios as never,
			hasher as never,
			cuentaRepo as never,
			refreshTokenRepo as never,
			new EmisorSesion(tokenService as never, refreshTokenRepo as never),
		);
	});

	const login = () => useCase.ejecutar({ code: "c", codeVerifier: "v" });

	it("con la cuenta de Google ya vinculada emite la sesión sin tocar nada", async () => {
		cuentaRepo.buscarUsuarioIdPorGoogleId.mockResolvedValue(5);
		usuarios.buscarPorId.mockResolvedValue(usuario(true));

		expect(await login()).toEqual({
			accessToken: "access",
			refreshToken: "refresh",
		});
		expect(usuarios.buscarPorEmail).not.toHaveBeenCalled();
		expect(cuentaRepo.vincularGoogle).not.toHaveBeenCalled();
	});

	it("sin cuenta crea el usuario y lo vincula", async () => {
		await login();

		expect(usuarios.crear).toHaveBeenCalledTimes(1);
		expect(cuentaRepo.vincularGoogle).toHaveBeenCalledWith(9, "g-1");
	});

	it("vincula una cuenta verificada con el mismo email sin anular su contraseña", async () => {
		usuarios.buscarPorEmail.mockResolvedValue(usuario(true));

		await login();

		expect(usuarios.actualizar).not.toHaveBeenCalled();
		expect(cuentaRepo.vincularGoogle).toHaveBeenCalledWith(5, "g-1");
	});

	it("al vincular una cuenta sin verificar anula su contraseña y sus sesiones (pre-secuestro)", async () => {
		usuarios.buscarPorEmail.mockResolvedValue(usuario(false));

		await login();

		const actualizado = usuarios.actualizar.mock.calls[0]?.[0] as Usuario;
		expect(actualizado.getPasswordHash()).toBe("hash-inutil");
		expect(refreshTokenRepo.revocarTodosPorUsuarioId).toHaveBeenCalledWith(5);
		expect(cuentaRepo.vincularGoogle).toHaveBeenCalledWith(5, "g-1");
	});

	it("rechaza a un usuario inactivo", async () => {
		usuarios.buscarPorEmail.mockResolvedValue(usuario(true, false));

		await expect(login()).rejects.toMatchObject({ code: 403 });
	});
});
