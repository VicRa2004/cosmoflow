import { describe, expect, it, mock } from "bun:test";
import { ResendMailer } from "./ResendMailer";
import { SmtpMailer } from "./SmtpMailer";

describe("SmtpMailer", () => {
	it("reenvía texto y html cuando html está definido", async () => {
		const sendMail = mock(async () => ({}));
		const mailer = new SmtpMailer({ sendMail }, "Cosmoflow <no-reply@test>");

		await mailer.enviar({
			para: "ana@test.dev",
			asunto: "Hola",
			texto: "Texto plano",
			html: "<p>HTML</p>",
		});

		expect(sendMail).toHaveBeenCalledWith({
			from: "Cosmoflow <no-reply@test>",
			to: "ana@test.dev",
			subject: "Hola",
			text: "Texto plano",
			html: "<p>HTML</p>",
		});
	});

	it("omite html si no se proporciona", async () => {
		const sendMail = mock(async () => ({}));
		const mailer = new SmtpMailer({ sendMail }, "Cosmoflow <no-reply@test>");

		await mailer.enviar({
			para: "ana@test.dev",
			asunto: "Hola",
			texto: "Solo texto",
		});

		expect(sendMail).toHaveBeenCalledWith({
			from: "Cosmoflow <no-reply@test>",
			to: "ana@test.dev",
			subject: "Hola",
			text: "Solo texto",
		});
	});
});

describe("ResendMailer", () => {
	it("incluye html en el payload cuando está presente", async () => {
		const fetchOriginal = globalThis.fetch;
		const fetchMock = mock(async () => new Response("{}", { status: 200 }));
		globalThis.fetch = fetchMock as unknown as typeof fetch;

		try {
			const mailer = new ResendMailer("re_test", "Cosmoflow <no-reply@test>");
			await mailer.enviar({
				para: "ana@test.dev",
				asunto: "Asunto",
				texto: "Texto",
				html: "<b>HTML</b>",
			});

			const [, init] = fetchMock.mock.calls[0] as unknown as [
				string,
				RequestInit,
			];
			expect(JSON.parse(String(init.body))).toEqual({
				from: "Cosmoflow <no-reply@test>",
				to: "ana@test.dev",
				subject: "Asunto",
				text: "Texto",
				html: "<b>HTML</b>",
			});
		} finally {
			globalThis.fetch = fetchOriginal;
		}
	});
});
