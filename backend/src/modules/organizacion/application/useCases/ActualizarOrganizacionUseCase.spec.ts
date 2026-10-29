import { describe, expect, it, mock } from "bun:test";
import { OrganizacionNoEncontradaError } from "../../domain/error/OrganizacionNoEncontradaError";
import { SinPermisoOrganizacionError } from "../../domain/error/SinPermisoOrganizacionError";
import { Organizacion } from "../../domain/Organizacion";
import { ActualizarOrganizacionUseCase } from "./ActualizarOrganizacionUseCase";

const acme = () =>
	Organizacion.reconstituir(1, {
		nombre: "Acme",
		descripcion: "",
		color: "#6366f1",
		avatar: null,
	});

const repoCon = (
	encontrada: { isAdmin: boolean; permisos: string[] } | null,
) => ({
	buscarPorId: mock(async () =>
		encontrada ? { organizacion: acme(), ...encontrada } : null,
	),
	actualizar: mock(async (o: Organizacion) => o),
});

describe("ActualizarOrganizacionUseCase", () => {
	it("el administrador cambia solo lo que envía", async () => {
		const useCase = new ActualizarOrganizacionUseCase(
			repoCon({ isAdmin: true, permisos: [] }) as never,
		);

		const result = await useCase.ejecutar(7, 1, { color: "#000000" });

		expect(result).toMatchObject({ nombre: "Acme", color: "#000000" });
	});

	it("un miembro con un rol que da organizacion:editar también puede", async () => {
		const useCase = new ActualizarOrganizacionUseCase(
			repoCon({ isAdmin: false, permisos: ["organizacion:editar"] }) as never,
		);
		expect(await useCase.ejecutar(7, 1, { nombre: "Nuevo" })).toMatchObject({
			nombre: "Nuevo",
			isAdmin: false,
			permisos: ["organizacion:editar"],
		});
	});

	it("un miembro sin ese permiso recibe 403", async () => {
		const repo = repoCon({ isAdmin: false, permisos: ["equipos:crear"] });
		const useCase = new ActualizarOrganizacionUseCase(repo as never);

		expect(useCase.ejecutar(7, 1, { nombre: "X" })).rejects.toThrow(
			SinPermisoOrganizacionError,
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
