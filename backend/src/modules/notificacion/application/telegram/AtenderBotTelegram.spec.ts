import { describe, expect, it, mock } from "bun:test";
import type { MensajeTelegram } from "../../domain/BotTelegram";
import { AtenderBotTelegram } from "./AtenderBotTelegram";
import { hashToken } from "./hashToken";

const TOKEN = "a".repeat(48);

const preparar = (mensajes: MensajeTelegram[], tokenValido = true) => {
	const bot = {
		nombreUsuario: mock(async () => "cosmoflow_bot"),
		enviar: mock(async () => true),
		recibir: mock(async () => mensajes),
	};
	const repo = { vincularPorToken: mock(async () => tokenValido) };
	return {
		bot,
		repo,
		atender: new AtenderBotTelegram(bot, repo as never),
	};
};

describe("AtenderBotTelegram", () => {
	it("vincula el chat privado con el token de /start y lo confirma", async () => {
		const { atender, bot, repo } = preparar([
			{ chatId: "42", privado: true, texto: `/start ${TOKEN}` },
		]);
		await atender.ejecutar();

		expect(repo.vincularPorToken).toHaveBeenCalledWith(hashToken(TOKEN), "42");
		expect(bot.enviar).toHaveBeenCalledWith(
			"42",
			expect.stringContaining("vinculada"),
		);
	});

	it("avisa si el enlace caducó o ya se usó", async () => {
		const { atender, bot } = preparar(
			[{ chatId: "42", privado: true, texto: `/start ${TOKEN}` }],
			false,
		);
		await atender.ejecutar();
		expect(bot.enviar).toHaveBeenCalledWith(
			"42",
			expect.stringContaining("caducó"),
		);
	});

	it("ignora los grupos y explica cómo vincular ante cualquier otro mensaje", async () => {
		const { atender, bot, repo } = preparar([
			{ chatId: "-1", privado: false, texto: `/start ${TOKEN}` },
			{ chatId: "42", privado: true, texto: "hola" },
		]);
		await atender.ejecutar();

		expect(repo.vincularPorToken).not.toHaveBeenCalled();
		expect(bot.enviar).toHaveBeenCalledTimes(1);
		expect(bot.enviar).toHaveBeenCalledWith(
			"42",
			expect.stringContaining("Vincular Telegram"),
		);
	});
});
