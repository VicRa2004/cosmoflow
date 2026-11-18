import { describe, expect, it, mock } from "bun:test";
import type { Aviso, Destinatario } from "../../domain/CanalNotificacion";
import type { ResultadoEnvioPush } from "../../domain/ClientePush";
import { MovilCanal } from "./MovilCanal";

const destinatario = (pushTokens: string[]): Destinatario => ({
	usuarioId: 7,
	email: "ana@x.dev",
	nombre: "Ana",
	telegramChatId: null,
	pushTokens,
});

const aviso: Aviso = {
	asunto: "Te asignaron «Demo»",
	texto: "Ahora eres responsable de la tarea «Demo».",
	enlace: "https://app.test/tareas/42",
	destino: { tipo: "tarea", id: 42 },
};

describe("MovilCanal", () => {
	it("no llama al proveedor si el usuario no tiene dispositivos", async () => {
		const enviar = mock(async (): Promise<ResultadoEnvioPush> => "enviado");
		const eliminarPorToken = mock(async () => {});
		const canal = new MovilCanal({ enviar }, { eliminarPorToken } as never);

		await canal.enviar(destinatario([]), aviso);
		expect(enviar).not.toHaveBeenCalled();
	});

	it("envía a todos los dispositivos incluyendo el destino estructurado", async () => {
		const enviar = mock(async (): Promise<ResultadoEnvioPush> => "enviado");
		const eliminarPorToken = mock(async () => {});
		const canal = new MovilCanal({ enviar }, { eliminarPorToken } as never);

		await canal.enviar(destinatario(["token-1", "token-2"]), aviso);

		expect(enviar).toHaveBeenCalledTimes(2);
		expect(enviar).toHaveBeenCalledWith("token-1", {
			titulo: aviso.asunto,
			cuerpo: aviso.texto,
			datos: {
				enlace: aviso.enlace,
				tipo: "tarea",
				id: "42",
			},
		});
		expect(eliminarPorToken).not.toHaveBeenCalled();
	});

	it("elimina automáticamente los tokens marcados como inválidos", async () => {
		const enviar = mock(
			async (token: string): Promise<ResultadoEnvioPush> =>
				token === "token-viejo" ? "token_invalido" : "enviado",
		);
		const eliminarPorToken = mock(async () => {});
		const canal = new MovilCanal({ enviar }, { eliminarPorToken } as never);

		await canal.enviar(destinatario(["token-viejo", "token-ok"]), aviso);

		expect(eliminarPorToken).toHaveBeenCalledTimes(1);
		expect(eliminarPorToken).toHaveBeenCalledWith("token-viejo");
	});

	it("relanza el error transitorio si ningún dispositivo recibió el aviso", async () => {
		const enviar = mock(async (): Promise<ResultadoEnvioPush> => {
			throw new Error("FCM 503");
		});
		const eliminarPorToken = mock(async () => {});
		const canal = new MovilCanal({ enviar }, { eliminarPorToken } as never);

		await expect(
			canal.enviar(destinatario(["token-1"]), aviso),
		).rejects.toThrow("FCM 503");
	});

	it("no relanza si al menos un dispositivo sí recibió el aviso", async () => {
		const enviar = mock(async (token: string): Promise<ResultadoEnvioPush> => {
			if (token === "token-falla") throw new Error("timeout");
			return "enviado";
		});
		const eliminarPorToken = mock(async () => {});
		const canal = new MovilCanal({ enviar }, { eliminarPorToken } as never);

		await expect(
			canal.enviar(destinatario(["token-falla", "token-ok"]), aviso),
		).resolves.toBeUndefined();
	});
});
