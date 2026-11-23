import { describe, expect, it, mock } from "bun:test";
import { ComentarioNoEncontradoError } from "../../domain/error/ComentarioNoEncontradoError";
import type { ComentarioTarea } from "../../domain/repository/ComentarioTareaRepository";
import { Tarea } from "../../domain/Tarea";
import { ContextosTarea } from "../services/ContextosTarea";
import { ActualizarComentarioUseCase } from "./ActualizarComentarioUseCase";
import { CrearComentarioUseCase } from "./CrearComentarioUseCase";

const TAREA_ID = 42;
const ORG_ID = 10;
const ANA = 1;
const BETO = 2;
const CARLA = 3;

const tareaCompartida = () => {
	const base = Tarea.crear(
		ANA,
		{ titulo: "Demo" },
		{ organizacionId: ORG_ID, equipoId: null, proyectoId: null },
		[BETO],
	);
	return Tarea.reconstituir(
		TAREA_ID,
		base.getUsuarioId(),
		base.getDatos(),
		base.getUbicacion(),
		[...base.getResponsableIds()],
	);
};

const comentarioBase = (
	override: Partial<ComentarioTarea> = {},
): ComentarioTarea => ({
	id: 100,
	tareaId: TAREA_ID,
	autorId: ANA,
	autorNombre: "Ana",
	autorAvatar: "avatar-ana.png",
	padreId: null,
	contenido: "Comentario raíz",
	createdAt: new Date("2026-11-22T12:00:00.000Z"),
	editadoEn: null,
	...override,
});

const preparar = (existentes: ComentarioTarea[] = []) => {
	const tareaRepo = {
		buscarPorId: mock(async () => tareaCompartida()),
	};
	const comentarios = {
		buscarPorId: mock(
			async (_tareaId: number, id: number) =>
				existentes.find((c) => c.id === id) ?? null,
		),
		crear: mock(
			async (datos: {
				tareaId: number;
				autorId: number;
				contenido: string;
				padreId?: number | null;
			}) =>
				comentarioBase({
					id: 200,
					autorId: datos.autorId,
					autorNombre: "Beto",
					autorAvatar: null,
					contenido: datos.contenido,
					padreId: datos.padreId ?? null,
				}),
		),
		actualizar: mock(async (id: number, contenido: string) => {
			const original = existentes.find((c) => c.id === id) ?? comentarioBase();
			return { ...original, contenido, editadoEn: new Date() };
		}),
	};
	const contextos = new ContextosTarea(
		{ contexto: mock(async () => null) },
		{ contexto: mock(async () => null) },
		{
			contexto: mock(async () => ({
				organizacionId: ORG_ID,
				miembroIds: [ANA, BETO, CARLA],
				puedeCrear: true,
			})),
		},
	);
	const eventBus = { publish: mock(async () => {}), publishAll: mock() };
	const uow = { ejecutar: <T>(fn: () => Promise<T>) => fn() };

	return {
		comentarios,
		eventBus,
		crear: new CrearComentarioUseCase(
			tareaRepo as never,
			contextos,
			comentarios as never,
			eventBus,
			uow,
		),
		actualizar: new ActualizarComentarioUseCase(
			tareaRepo as never,
			contextos,
			comentarios as never,
			eventBus,
			uow,
		),
	};
};

describe("CrearComentarioUseCase (hilos de 1 nivel)", () => {
	it("crea una respuesta asociada al comentario raíz y notifica a su autor", async () => {
		const raiz = comentarioBase({ id: 10, autorId: ANA, padreId: null });
		const { crear, comentarios, eventBus } = preparar([raiz]);

		const dto = await crear.ejecutar(BETO, TAREA_ID, {
			contenido: "De acuerdo, [@Carla](mencion:3)",
			padreId: 10,
		});

		expect(comentarios.crear).toHaveBeenCalledWith({
			tareaId: TAREA_ID,
			autorId: BETO,
			contenido: "De acuerdo, [@Carla](mencion:3)",
			padreId: 10,
		});
		expect(dto.padreId).toBe(10);
		expect(eventBus.publish).toHaveBeenCalledWith(
			expect.objectContaining({
				eventName: "tarea.comentada",
				data: expect.objectContaining({
					tareaId: TAREA_ID,
					autorId: BETO,
					mencionIds: [CARLA],
					respondeAAutorId: ANA,
				}),
			}),
		);
	});

	it("mantiene 1 solo nivel al responder a una respuesta (cuelga del raíz pero avisa al autor respondido)", async () => {
		const respuesta = comentarioBase({ id: 11, autorId: BETO, padreId: 10 });
		const { crear, comentarios, eventBus } = preparar([respuesta]);

		const dto = await crear.ejecutar(CARLA, TAREA_ID, {
			contenido: "Gracias por el dato",
			padreId: 11,
		});

		expect(comentarios.crear).toHaveBeenCalledWith(
			expect.objectContaining({ padreId: 10 }),
		);
		expect(dto.padreId).toBe(10);
		expect(eventBus.publish).toHaveBeenCalledWith(
			expect.objectContaining({
				data: expect.objectContaining({ respondeAAutorId: BETO }),
			}),
		);
	});

	it("rechaza responder a un comentario inexistente en la tarea", async () => {
		const { crear } = preparar([]);
		await expect(
			crear.ejecutar(BETO, TAREA_ID, { contenido: "Hola", padreId: 999 }),
		).rejects.toBeInstanceOf(ComentarioNoEncontradoError);
	});
});

describe("ActualizarComentarioUseCase (menciones nuevas al editar)", () => {
	it("notifica solo a las menciones nuevas agregadas al editar", async () => {
		const original = comentarioBase({
			id: 10,
			autorId: ANA,
			contenido: "Hola [@Beto](mencion:2)",
		});
		const { actualizar, eventBus } = preparar([original]);

		const dto = await actualizar.ejecutar(
			ANA,
			{ tareaId: TAREA_ID, id: 10 },
			"Hola [@Beto](mencion:2) y [@Carla](mencion:3)",
		);

		expect(dto.autorAvatarUrl).toBe("/api/avatares/1?v=avatar-ana.png");
		expect(eventBus.publish).toHaveBeenCalledTimes(1);
		expect(eventBus.publish).toHaveBeenCalledWith(
			expect.objectContaining({
				eventName: "tarea.mencionados",
				data: { tareaId: TAREA_ID, usuarioIds: [CARLA] },
			}),
		);
	});

	it("no publica evento si al editar no se agregaron menciones nuevas", async () => {
		const original = comentarioBase({
			id: 10,
			autorId: ANA,
			contenido: "Texto original",
		});
		const { actualizar, eventBus } = preparar([original]);

		await actualizar.ejecutar(
			ANA,
			{ tareaId: TAREA_ID, id: 10 },
			"Texto corregido",
		);

		expect(eventBus.publish).not.toHaveBeenCalled();
	});
});
