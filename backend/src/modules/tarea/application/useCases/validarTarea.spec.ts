import { describe, expect, it } from "bun:test";
import type { TareaRepository } from "../../domain/repository/TareaRepository";
import { type DatosTarea, Tarea } from "../../domain/Tarea";
import { validarTarea } from "./validarTarea";

const USUARIO = 7;

const tarea = (
	id: number,
	datos: Partial<DatosTarea> = {},
	usuarioId = USUARIO,
) =>
	Tarea.reconstituir(
		id,
		usuarioId,
		Tarea.crear(usuarioId, { titulo: `T${id}`, ...datos }).getDatos(),
	);

const repoCon = (...tareas: Tarea[]) =>
	({
		buscarPorId: async (id: number) =>
			tareas.find((t) => t.getId() === id) ?? null,
	}) as unknown as TareaRepository;

/** Edita `t` con `cambios` y valida como lo hace `ActualizarTareaUseCase`. */
const editar = (
	repo: TareaRepository,
	t: Tarea,
	cambios: Partial<DatosTarea>,
) => {
	const antes = t.getDatos();
	t.actualizar(cambios);
	return validarTarea(repo, t, null, antes);
};

describe("validarTarea · dependencias", () => {
	it("no deja empezar ni completar hasta completar la principal", async () => {
		const principal = tarea(1);
		const hija = tarea(2, { dependeDeId: 1 });
		const repo = repoCon(principal, hija);

		await expect(editar(repo, hija, { estado: "en_progreso" })).rejects.toThrow(
			"Primero hay que completar «T1»",
		);
		principal.actualizar({ estado: "completada" });
		await editar(repo, tarea(2, { dependeDeId: 1 }), { estado: "completada" });
	});

	it("una tarea nueva ya empezada también respeta la dependencia", async () => {
		const nueva = Tarea.crear(USUARIO, {
			titulo: "Nueva",
			dependeDeId: 1,
			estado: "completada",
		});
		await expect(validarTarea(repoCon(tarea(1)), nueva, null)).rejects.toThrow(
			"Primero hay que completar",
		);
	});

	it("rechaza ciclos y principales de otro sitio", async () => {
		const a = tarea(1, { dependeDeId: 2 });
		const b = tarea(2);
		const ajena = tarea(3, {}, USUARIO + 1);
		const repo = repoCon(a, b, ajena);

		await expect(editar(repo, b, { dependeDeId: 1 })).rejects.toThrow(
			"no puede depender de sí misma",
		);
		await expect(editar(repo, tarea(2), { dependeDeId: 2 })).rejects.toThrow(
			"no puede depender de sí misma",
		);
		await expect(editar(repo, tarea(2), { dependeDeId: 3 })).rejects.toThrow(
			"mismo sitio",
		);
	});

	it("editar otra cosa de una tarea ya empezada no exige la principal", async () => {
		const repo = repoCon(tarea(1));
		await editar(repo, tarea(2, { dependeDeId: 1, estado: "en_progreso" }), {
			titulo: "Otro",
		});
	});
});
