import { describe, expect, it } from "vitest";
import type { ComentarioTareaDto } from "../api/comentariosApi";
import { agruparHilos } from "./ComentariosTarea";

const crearComentario = (
	id: number,
	padreId: number | null = null,
): ComentarioTareaDto => ({
	id,
	tareaId: 1,
	autorId: 1,
	autorNombre: "Ana",
	autorAvatarUrl: null,
	padreId,
	contenido: `Comentario ${id}`,
	createdAt: "2026-11-22T12:00:00.000Z",
	editadoEn: null,
});

describe("agruparHilos", () => {
	it("agrupa comentarios raíz y sus respuestas en hilos de 1 nivel", () => {
		const c1 = crearComentario(1, null);
		const c2 = crearComentario(2, null);
		const r1 = crearComentario(3, 1);
		const r2 = crearComentario(4, 1);

		const { raices, respuestasPorPadre } = agruparHilos([c1, c2, r1, r2]);

		expect(raices.map((c) => c.id)).toEqual([1, 2]);
		expect(respuestasPorPadre.get(1)?.map((c) => c.id)).toEqual([3, 4]);
		expect(respuestasPorPadre.get(2)).toBeUndefined();
	});

	it("muestra como raíz una respuesta cuyo padre no está en la página", () => {
		const huerfana = crearComentario(10, 999);
		const { raices, respuestasPorPadre } = agruparHilos([huerfana]);

		expect(raices.map((c) => c.id)).toEqual([10]);
		expect(respuestasPorPadre.size).toBe(0);
	});
});
