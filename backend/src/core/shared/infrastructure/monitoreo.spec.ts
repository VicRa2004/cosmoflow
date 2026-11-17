import { describe, expect, it } from "bun:test";
import type { ErrorEvent } from "@sentry/bun";
import { limpiarEvento } from "./monitoreo";

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
