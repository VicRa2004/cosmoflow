import { describe, expect, it, mock } from "bun:test";
import { NotaNoEncontradaError } from "../../domain/error/NotaNoEncontradaError";
import { Nota } from "../../domain/Nota";
import { ProyectosNota } from "../services/ProyectosNota";
import { ObtenerNotaUseCase } from "./ObtenerNotaUseCase";

const DUENO = 7;
const OTRO = 8;
const datos = { titulo: "Ejemplo", contenido: "", tagIds: [] };

const preparar = (nota: Nota | null, esMiembro = false) =>
	new ObtenerNotaUseCase(
		new ProyectosNota({ buscarPorId: mock(async () => nota) } as never, {
			contexto: mock(async () =>
				esMiembro
					? { organizacionId: 10, miembroIds: [], puedeCrear: true }
					: null,
			),
		}),
	);

describe("ObtenerNotaUseCase", () => {
	it("debería devolver la nota personal a su dueño", async () => {
		const nota = Nota.reconstituir(1, DUENO, datos, new Date());
		expect(await preparar(nota).ejecutar(DUENO, 1)).toMatchObject({
			id: 1,
			titulo: "Ejemplo",
			proyectoId: null,
		});
	});

	it("debería lanzar NotaNoEncontradaError si no existe o es personal de otro", async () => {
		await expect(preparar(null).ejecutar(DUENO, 1)).rejects.toThrow(
			NotaNoEncontradaError,
		);
		const ajena = Nota.reconstituir(1, DUENO, datos, new Date());
		await expect(preparar(ajena, true).ejecutar(OTRO, 1)).rejects.toThrow(
			NotaNoEncontradaError,
		);
	});

	it("una de proyecto la ven sus miembros y nadie más (RN-33)", async () => {
		const deProyecto = Nota.reconstituir(1, DUENO, datos, new Date(), {
			organizacionId: 10,
			proyectoId: 4,
		});
		expect(await preparar(deProyecto, true).ejecutar(OTRO, 1)).toMatchObject({
			proyectoId: 4,
		});
		await expect(preparar(deProyecto).ejecutar(OTRO, 1)).rejects.toThrow(
			NotaNoEncontradaError,
		);
	});
});
