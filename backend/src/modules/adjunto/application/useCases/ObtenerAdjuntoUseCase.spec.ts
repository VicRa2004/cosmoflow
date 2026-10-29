import { describe, expect, it, mock } from "bun:test";
import type { Adjunto } from "../../domain/Adjunto";
import { AdjuntoNoEncontradoError } from "../../domain/error/AdjuntoNoEncontradoError";
import { ObtenerAdjuntoUseCase } from "./ObtenerAdjuntoUseCase";

const DUENO = 7;
const OTRO = 8;
const privado: Adjunto = {
	id: 12,
	usuarioId: DUENO,
	clave: "adjuntos/7/x.png",
	tipo: "image/png",
	bytes: 3,
	equipoId: null,
	proyectoId: null,
};
const datos = new Uint8Array([1, 2, 3]);

const preparar = (
	adjunto: Adjunto | null,
	{ esMiembro = false, enDisco = true } = {},
) =>
	new ObtenerAdjuntoUseCase(
		{ buscarPorId: mock(async () => adjunto) } as never,
		{ obtener: mock(async () => (enDisco ? datos : null)) } as never,
		{ esMiembro: mock(async () => esMiembro) } as never,
	);

describe("ObtenerAdjuntoUseCase", () => {
	it("debería devolver los bytes y el tipo del adjunto propio", async () => {
		expect(await preparar(privado).ejecutar(DUENO, 12)).toEqual({
			datos,
			tipo: "image/png",
		});
	});

	it("un adjunto privado no existe para otro usuario", async () => {
		await expect(preparar(privado).ejecutar(OTRO, 12)).rejects.toThrow(
			AdjuntoNoEncontradoError,
		);
	});

	it("uno compartido con un equipo lo ven sus miembros, y nadie más", async () => {
		const compartido = { ...privado, equipoId: 5 };
		expect(
			await preparar(compartido, { esMiembro: true }).ejecutar(OTRO, 12),
		).toEqual({ datos, tipo: "image/png" });
		await expect(preparar(compartido).ejecutar(OTRO, 12)).rejects.toThrow(
			AdjuntoNoEncontradoError,
		);
	});

	it("debería lanzar 404 si falta el archivo en el almacenamiento", async () => {
		await expect(
			preparar(privado, { enDisco: false }).ejecutar(DUENO, 12),
		).rejects.toThrow(AdjuntoNoEncontradoError);
	});
});
