import { describe, expect, it, mock } from "bun:test";
import { NotificacionNoEncontradaError } from "../../domain/error/NotificacionNoEncontradaError";
import { AppCanal } from "../../infrastructure/canales/AppCanal";
import { MarcarNotificacionLeidaUseCase } from "./MarcarNotificacionLeidaUseCase";

describe("AppCanal y bandeja de notificaciones (#51)", () => {
	it("AppCanal guarda el aviso con su destino, evento y actor en la bandeja del usuario", async () => {
		const crear = mock(async () => {});
		const canal = new AppCanal({ crear } as never);

		await canal.enviar(
			{
				usuarioId: 7,
				email: "ana@example.com",
				nombre: "Ana",
				telegramChatId: null,
				pushTokens: [],
			},
			{
				asunto: "Te asignaron una tarea",
				texto: "Revisa el despliegue",
				enlace: "https://app.test/tareas/42",
				destino: { tipo: "tarea", id: 42 },
				evento: "tareaAsignada",
				actorId: 3,
			},
		);

		expect(crear).toHaveBeenCalledWith({
			usuarioId: 7,
			asunto: "Te asignaron una tarea",
			texto: "Revisa el despliegue",
			enlace: "https://app.test/tareas/42",
			tipo: "tarea",
			recursoId: 42,
			evento: "tareaAsignada",
			actorId: 3,
		});
	});

	it("MarcarNotificacionLeidaUseCase lanza 404 si no existe o es de otro usuario", async () => {
		const useCase = new MarcarNotificacionLeidaUseCase({
			marcarLeida: mock(async () => false),
		} as never);

		await expect(useCase.ejecutar(7, 99)).rejects.toThrow(
			NotificacionNoEncontradaError,
		);
	});
});
