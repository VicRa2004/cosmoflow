import { describe, expect, it, mock } from "bun:test";
import type { Preferencia } from "../../domain/catalogo";
import { Notificador } from "./Notificador";

const ANA = 1;
const BETO = 2;
const aviso = { asunto: "A", texto: "T", enlace: "/tareas/1" };

const preparar = ({
	guardadas = [] as Preferencia[],
	yaEnviado = false,
	falla = false,
} = {}) => {
	const repo = {
		destinatarios: mock(async (ids: number[]) =>
			ids.map((usuarioId) => ({
				usuarioId,
				email: `${usuarioId}@x.dev`,
				nombre: "X",
			})),
		),
		preferencias: mock(async () => guardadas),
		registrarEnvio: mock(async () => !yaEnviado),
		anularEnvio: mock(async () => {}),
	};
	const correo = {
		canal: "correo" as const,
		enviar: mock(async () => {
			if (falla) throw new Error("smtp caído");
		}),
	};
	return {
		repo,
		correo,
		notificador: new Notificador(repo as never, [correo]),
	};
};

const notificar = (notificador: Notificador) =>
	notificador.notificar({
		evento: "tareaAsignada",
		usuarioIds: [ANA, BETO, BETO],
		actorId: ANA,
		clave: "tarea.responsablesAsignados:1:fecha",
		aviso,
	});

describe("Notificador", () => {
	it("avisa por correo por defecto, una vez, y nunca a quien hizo la acción", async () => {
		const { notificador, correo, repo } = preparar();
		await notificar(notificador);

		expect(repo.destinatarios).toHaveBeenCalledWith([BETO]);
		expect(correo.enviar).toHaveBeenCalledTimes(1);
		expect(repo.registrarEnvio).toHaveBeenCalledWith(
			"tarea.responsablesAsignados:1:fecha:2:correo",
		);
	});

	it("no avisa si el usuario lo desactivó", async () => {
		const { notificador, correo } = preparar({
			guardadas: [{ evento: "tareaAsignada", canal: "correo", activo: false }],
		});
		await notificar(notificador);
		expect(correo.enviar).not.toHaveBeenCalled();
	});

	it("no repite un aviso ya enviado en un intento anterior del outbox", async () => {
		const { notificador, correo } = preparar({ yaEnviado: true });
		await notificar(notificador);
		expect(correo.enviar).not.toHaveBeenCalled();
	});

	it("si el canal falla, anula el registro para que el reintento lo envíe", async () => {
		const { notificador, repo } = preparar({ falla: true });
		await expect(notificar(notificador)).rejects.toThrow("smtp caído");
		expect(repo.anularEnvio).toHaveBeenCalledWith(
			"tarea.responsablesAsignados:1:fecha:2:correo",
		);
	});
});
