import { describe, expect, it, mock } from "bun:test";
import { Organizacion } from "../../domain/Organizacion";
import { CrearOrganizacionUseCase } from "./CrearOrganizacionUseCase";

describe("CrearOrganizacionUseCase", () => {
	it("crea la organización con el creador como administrador (RN-11)", async () => {
		const repo = {
			crear: mock(async (o: Organizacion) =>
				Organizacion.reconstituir(1, {
					nombre: o.getNombre(),
					descripcion: o.getDescripcion(),
					color: o.getColor(),
					avatar: null,
				}),
			),
		};
		const useCase = new CrearOrganizacionUseCase(repo as never);

		const result = await useCase.ejecutar(7, {
			nombre: "Acme",
			descripcion: "",
			color: "#6366f1",
		});

		expect(repo.crear).toHaveBeenCalledWith(expect.any(Organizacion), 7);
		expect(result).toEqual({
			id: 1,
			nombre: "Acme",
			descripcion: "",
			color: "#6366f1",
			avatarUrl: null,
			isAdmin: true,
		});
	});
});
