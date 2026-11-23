import { beforeAll, describe, expect, it } from "bun:test";
import { api, crearUsuario, login } from "@/test/e2e";

// Los usuarios de tareas los vacía TareaRouter.e2e: aquí emails propios, sin vaciar.
describe("Feed iCalendar de tareas (e2e)", () => {
	let ivo: string;
	const feed = (url: string) =>
		api(new URL(url).pathname + new URL(url).search);
	const generar = async () =>
		(
			await (
				await api("/api/calendario/suscripcion", { method: "POST", token: ivo })
			).json()
		).url as string;

	beforeAll(async () => {
		await crearUsuario("ivo@calendario.dev", "USUARIO");
		ivo = await login("ivo@calendario.dev");
		for (const body of [
			{ titulo: "Con fecha", fechaVencimiento: "2026-11-20" },
			{ titulo: "Sin fecha" },
			{ titulo: "Hecha", estado: "completada", fechaVencimiento: "2026-11-21" },
		]) {
			await api("/api/tareas", { method: "POST", token: ivo, body });
		}
	});

	it("sin suscripción está inactiva", async () => {
		const res = await api("/api/calendario/suscripcion", { token: ivo });
		expect(await res.json()).toEqual({ activa: false, creadaEn: null });
	});

	it("la URL generada sirve solo los pendientes con fecha", async () => {
		const url = await generar();
		const res = await feed(url);
		expect(res.status).toBe(200);
		expect(res.headers.get("content-type")).toContain("text/calendar");
		const ics = await res.text();
		expect(ics).toContain("SUMMARY:Con fecha");
		expect(ics).toContain("DTSTART;VALUE=DATE:20261120");
		expect(ics).not.toContain("Sin fecha");
		expect(ics).not.toContain("Hecha");
		const estado = await api("/api/calendario/suscripcion", { token: ivo });
		expect((await estado.json()).activa).toBe(true);
	});

	it("regenerar invalida la URL anterior y revocar la nueva", async () => {
		const vieja = await generar();
		const nueva = await generar();
		expect((await feed(vieja)).status).toBe(404);
		expect((await feed(nueva)).status).toBe(200);
		await api("/api/calendario/suscripcion", { method: "DELETE", token: ivo });
		expect((await feed(nueva)).status).toBe(404);
	});

	it("rechaza tokens con formato inválido", async () => {
		expect((await api("/api/calendario/tareas.ics?token=x")).status).toBe(400);
	});
});
