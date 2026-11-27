import { describe, expect, it } from "bun:test";
import type { ErrorEvent } from "@sentry/bun";
import { idDeTraza, limpiarEvento, urlIngesta } from "./monitoreo";

describe("limpiarEvento", () => {
	it("debería quitar cuerpo, cookies, cabeceras, query y datos del usuario salvo el id", () => {
		const evento = limpiarEvento({
			type: undefined,
			request: {
				method: "POST",
				url: "https://app.dev/api/notas?q=secreto",
				data: { contenido: "nota privada" },
				cookies: { refresh: "x" },
				headers: { authorization: "Bearer x" },
			},
			user: { id: "7", email: "ana@x.dev", ip_address: "1.2.3.4" },
			breadcrumbs: [{ message: "correo enviado a ana@x.dev" }],
		} as ErrorEvent);

		expect(evento.request).toEqual({
			method: "POST",
			url: "https://app.dev/api/notas",
		});
		expect(evento.user).toEqual({ id: "7" });
		expect(evento.breadcrumbs).toBeUndefined();
	});
});

describe("urlIngesta", () => {
	const dsn = "https://clave@glitchtip.dev/7";
	const sobre = (d: string) =>
		`${JSON.stringify({ dsn: d })}\n{"type":"event"}\n{}`;

	it("debería devolver el endpoint de ingesta cuando el sobre va a nuestro DSN", () => {
		expect(urlIngesta(sobre(dsn), dsn)).toBe(
			"https://glitchtip.dev/api/7/envelope/?sentry_key=clave",
		);
	});

	it("debería rechazar otro host, otro proyecto, un sobre inválido o sin DSN configurado", () => {
		expect(urlIngesta(sobre("https://clave@evil.dev/7"), dsn)).toBeUndefined();
		expect(
			urlIngesta(sobre("https://clave@glitchtip.dev/8"), dsn),
		).toBeUndefined();
		expect(urlIngesta("no es json", dsn)).toBeUndefined();
		expect(urlIngesta(sobre(dsn), undefined)).toBeUndefined();
	});
});

describe("idDeTraza", () => {
	it("debería sacar el trace-id de un traceparent W3C válido", () => {
		expect(
			idDeTraza("00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01"),
		).toBe("4bf92f3577b34da6a3ce929d0e0e4736");
	});

	it("debería ignorar lo que no es un traceparent válido", () => {
		for (const valor of [
			undefined,
			42,
			"",
			"basura",
			"00-00000000000000000000000000000000-00f067aa0ba902b7-01",
			"00-4BF92F3577B34DA6A3CE929D0E0E4736-00f067aa0ba902b7-01",
			"00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01\r\nX: y",
		]) {
			expect(idDeTraza(valor)).toBeUndefined();
		}
	});
});
