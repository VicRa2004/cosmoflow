import { describe, expect, it, mock } from "bun:test";
import { OrganizacionNoEncontradaError } from "../../domain/error/OrganizacionNoEncontradaError";
import { SoloAdminOrganizacionError } from "../../domain/error/SoloAdminOrganizacionError";
import { Organizacion } from "../../domain/Organizacion";
import { ActualizarOrganizacionUseCase } from "./ActualizarOrganizacionUseCase";

const acme = () =>
	Organizacion.reconstituir(1, {
		nombre: "Acme",
		descripcion: "",
		color: "#6366f1",
		avatar: null,
	});

const repoCon = (encontrada: { isAdmin: boolean } | null) => ({
	buscarPorId: mock(async () =>
		encontrada ? { organizacion: acme(), ...encontrada } : null,
	),
	actualizar: mock(async (o: Organizacion) => o),
});

describe("ActualizarOrganizacionUseCase", () => {
	it("el administrador cambia solo lo que envía", async () => {
		const useCase = new ActualizarOrganizacionUseCase(
			repoCon({ isAdmin: true }) as never,
		);

		const result = await useCase.ejecutar(7, 1, { color: "#000000" });

		expect(result).toMatchObject({ nombre: "Acme", color: "#000000" });
	});

	it("un miembro que no es administrador recibe 403", async () => {
		const repo = repoCon({ isAdmin: false });
		const useCase = new ActualizarOrganizacionUseCase(repo as never);

		expect(useCase.ejecutar(7, 1, { nombre: "X" })).rejects.toThrow(
			SoloAdminOrganizacionError,
		);
		expect(repo.actualizar).not.toHaveBeenCalled();
	});

	it("quien no es miembro recibe 404 (RN-90)", async () => {
		const repo = repoCon(null);
		const useCase = new ActualizarOrganizacionUseCase(repo as never);

		expect(useCase.ejecutar(7, 1, { nombre: "X" })).rejects.toThrow(
			OrganizacionNoEncontradaError,
		);
		expect(repo.actualizar).not.toHaveBeenCalled();
	});
});
