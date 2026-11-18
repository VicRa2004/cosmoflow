import { describe, expect, it, mock } from "bun:test";
import { generateKeyPairSync } from "node:crypto";
import { FcmCliente } from "./FcmCliente";

const { privateKey } = generateKeyPairSync("rsa", {
	modulusLength: 2048,
	privateKeyEncoding: { type: "pkcs8", format: "pem" },
	publicKeyEncoding: { type: "spki", format: "pem" },
});

const respuestaJson = (body: unknown, status = 200) =>
	new Response(JSON.stringify(body), {
		status,
		headers: { "Content-Type": "application/json" },
	});

describe("FcmCliente", () => {
	it("obtiene el access token OAuth2, lo reutiliza y envía el mensaje por FCM v1", async () => {
		const llamadas: Array<{ url: string; body?: string }> = [];
		const fetchMock = mock(async (input: string | URL, init?: RequestInit) => {
			const url = String(input);
			llamadas.push({ url, body: init?.body ? String(init.body) : undefined });
			if (url.includes("oauth2.googleapis.com")) {
				return respuestaJson({ access_token: "ya29.test", expires_in: 3600 });
			}
			return respuestaJson({ name: "projects/mi-proj/messages/1" });
		});

		const cliente = new FcmCliente(
			"mi-proj",
			"fcm@mi-proj.iam.gserviceaccount.com",
			privateKey.replace(/\n/g, "\\n"),
			fetchMock as unknown as typeof fetch,
		);

		const r1 = await cliente.enviar("tok-1", {
			titulo: "Hola",
			cuerpo: "Cuerpo",
			datos: { tipo: "tarea", id: "5" },
		});
		const r2 = await cliente.enviar("tok-2", { titulo: "Otro", cuerpo: "Msg" });

		expect(r1).toBe("enviado");
		expect(r2).toBe("enviado");
		// 1 llamada OAuth + 2 envíos FCM (el token se reutilizó).
		expect(llamadas).toHaveLength(3);
		expect(llamadas[1]?.url).toBe(
			"https://fcm.googleapis.com/v1/projects/mi-proj/messages:send",
		);
		expect(JSON.parse(llamadas[1]?.body ?? "{}")).toEqual({
			message: {
				token: "tok-1",
				notification: { title: "Hola", body: "Cuerpo" },
				data: { tipo: "tarea", id: "5" },
			},
		});
	});

	it("devuelve token_invalido cuando FCM responde 404 UNREGISTERED", async () => {
		const fetchMock = mock(async (input: string | URL) => {
			if (String(input).includes("oauth2.googleapis.com")) {
				return respuestaJson({ access_token: "ya29.test", expires_in: 3600 });
			}
			return respuestaJson(
				{
					error: {
						status: "NOT_FOUND",
						message: "Requested entity was not found.",
						details: [{ errorCode: "UNREGISTERED" }],
					},
				},
				404,
			);
		});

		const cliente = new FcmCliente(
			"mi-proj",
			"fcm@mi-proj.iam.gserviceaccount.com",
			privateKey,
			fetchMock as unknown as typeof fetch,
		);

		expect(
			await cliente.enviar("tok-muerto", { titulo: "T", cuerpo: "C" }),
		).toBe("token_invalido");
	});

	it("lanza error en fallos 5xx para que el outbox reintente", async () => {
		const fetchMock = mock(async (input: string | URL) => {
			if (String(input).includes("oauth2.googleapis.com")) {
				return respuestaJson({ access_token: "ya29.test", expires_in: 3600 });
			}
			return respuestaJson({ error: { message: "Unavailable" } }, 503);
		});

		const cliente = new FcmCliente(
			"mi-proj",
			"fcm@mi-proj.iam.gserviceaccount.com",
			privateKey,
			fetchMock as unknown as typeof fetch,
		);

		await expect(
			cliente.enviar("tok-1", { titulo: "T", cuerpo: "C" }),
		).rejects.toThrow("FCM respondió 503");
	});
});
