import { describe, expect, it, mock } from "bun:test";
import { SoloAdminOrganizacionError } from "../../domain/error/SoloAdminOrganizacionError";
import { Organizacion } from "../../domain/Organizacion";
import { EliminarOrganizacionUseCase } from "./EliminarOrganizacionUseCase";

const repoCon = (isAdmin: boolean) => ({
	buscarPorId: mock(async () => ({
		organizacion: Organizacion.reconstituir(1, {
			nombre: "Acme",
			descripcion: "",
			color: "#6366f1",
			avatar: null,
		}),
		isAdmin,
	})),
	eliminar: mock(async () => {}),
});

describe("EliminarOrganizacionUseCase", () => {
	it("el administrador la borra", async () => {
		const repo = repoCon(true);
		await new EliminarOrganizacionUseCase(repo as never).ejecutar(7, 1);
		expect(repo.eliminar).toHaveBeenCalledWith(1);
	});

	it("un miembro que no es administrador no puede", async () => {
		const repo = repoCon(false);
		expect(
			new EliminarOrganizacionUseCase(repo as never).ejecutar(7, 1),
		).rejects.toThrow(SoloAdminOrganizacionError);
		expect(repo.eliminar).not.toHaveBeenCalled();
	});
});
