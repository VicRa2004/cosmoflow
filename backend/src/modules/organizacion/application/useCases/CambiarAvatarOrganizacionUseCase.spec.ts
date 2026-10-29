import { describe, expect, it, mock } from "bun:test";
import { AvatarOrganizacionInvalidoError } from "../../domain/error/AvatarOrganizacionInvalidoError";
import { SoloAdminOrganizacionError } from "../../domain/error/SoloAdminOrganizacionError";
import { Organizacion } from "../../domain/Organizacion";
import { CambiarAvatarOrganizacionUseCase } from "./CambiarAvatarOrganizacionUseCase";

const PNG = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0]);

const preparar = (isAdmin: boolean, avatar: string | null = null) => {
	const repo = {
		buscarPorId: mock(async () => ({
			organizacion: Organizacion.reconstituir(1, {
				nombre: "Acme",
				descripcion: "",
				color: "#6366f1",
				avatar,
			}),
			isAdmin,
		})),
		actualizar: mock(async (o: Organizacion) => o),
	};
	const almacenamiento = {
		guardar: mock(async () => {}),
		obtener: mock(async () => null),
		eliminar: mock(async () => {}),
	};
	return {
		repo,
		almacenamiento,
		useCase: new CambiarAvatarOrganizacionUseCase(
			repo as never,
			almacenamiento as never,
		),
	};
};

describe("CambiarAvatarOrganizacionUseCase", () => {
	it("guarda la imagen nueva y borra la anterior", async () => {
		const { useCase, almacenamiento } = preparar(
			true,
			"organizaciones/viejo.png",
		);

		const result = await useCase.ejecutar(7, 1, PNG);

		expect(almacenamiento.guardar).toHaveBeenCalled();
		expect(almacenamiento.eliminar).toHaveBeenCalledWith(
			"organizaciones/viejo.png",
		);
		expect(result.avatarUrl).toStartWith("/api/organizaciones/1/avatar?v=");
	});

	it("rechaza lo que no es PNG, JPEG ni WebP por sus bytes", async () => {
		const { useCase, almacenamiento } = preparar(true);
		expect(useCase.ejecutar(7, 1, new Uint8Array([1, 2, 3]))).rejects.toThrow(
			AvatarOrganizacionInvalidoError,
		);
		expect(almacenamiento.guardar).not.toHaveBeenCalled();
	});

	it("un miembro que no es administrador no sube nada", async () => {
		const { useCase, almacenamiento } = preparar(false);
		expect(useCase.ejecutar(7, 1, PNG)).rejects.toThrow(
			SoloAdminOrganizacionError,
		);
		expect(almacenamiento.guardar).not.toHaveBeenCalled();
	});
});
