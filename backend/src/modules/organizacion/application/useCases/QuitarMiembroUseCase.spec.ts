import { describe, expect, it, mock } from "bun:test";
import { AdminNoPuedeSalirError } from "../../domain/error/AdminNoPuedeSalirError";
import { MiembroNoEncontradoError } from "../../domain/error/MiembroNoEncontradoError";
import { SoloAdminOrganizacionError } from "../../domain/error/SoloAdminOrganizacionError";
import { Organizacion } from "../../domain/Organizacion";
import { QuitarMiembroUseCase } from "./QuitarMiembroUseCase";

const ANA = 1; // admin
const BETO = 2; // miembro
const CARLA = 3; // no miembro

const preparar = () => {
	const organizacion = Organizacion.reconstituir(10, {
		nombre: "Acme",
		descripcion: "",
		color: "#6366f1",
		avatar: null,
	});
	const repo = {
		buscarPorId: mock(async (usuarioId: number) =>
			usuarioId === CARLA ? null : { organizacion, isAdmin: usuarioId === ANA },
		),
		quitarMiembro: mock(async () => {}),
	};
	const eventBus = { publish: mock(async () => {}), publishAll: mock() };
	const uow = { ejecutar: <T>(fn: () => Promise<T>) => fn() };
	return {
		repo,
		eventBus,
		useCase: new QuitarMiembroUseCase(repo as never, eventBus, uow),
	};
};

describe("QuitarMiembroUseCase", () => {
	it("un miembro sale y queda registrado", async () => {
		const { useCase, repo, eventBus } = preparar();
		await useCase.ejecutar(BETO, 10, BETO);
		expect(repo.quitarMiembro).toHaveBeenCalledWith(10, BETO);
		expect(eventBus.publish).toHaveBeenCalledWith(
			expect.objectContaining({
				data: { organizacionId: 10, usuarioId: BETO, expulsado: false },
			}),
		);
	});

	it("el admin expulsa a un miembro", async () => {
		const { useCase, repo } = preparar();
		await useCase.ejecutar(ANA, 10, BETO);
		expect(repo.quitarMiembro).toHaveBeenCalledWith(10, BETO);
	});

	it("el admin no puede salir sin delegar (RN-16)", async () => {
		const { useCase, repo } = preparar();
		expect(useCase.ejecutar(ANA, 10, ANA)).rejects.toThrow(
			AdminNoPuedeSalirError,
		);
		expect(repo.quitarMiembro).not.toHaveBeenCalled();
	});

	it("un miembro no expulsa a otro", async () => {
		const { useCase, repo } = preparar();
		expect(useCase.ejecutar(BETO, 10, ANA)).rejects.toThrow(
			SoloAdminOrganizacionError,
		);
		expect(repo.quitarMiembro).not.toHaveBeenCalled();
	});

	it("no se expulsa a quien no es miembro", async () => {
		const { useCase } = preparar();
		expect(useCase.ejecutar(ANA, 10, CARLA)).rejects.toThrow(
			MiembroNoEncontradoError,
		);
	});
});
