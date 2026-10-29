import { beforeAll, describe, expect, it } from "bun:test";
import { api, crearUsuario, login } from "@/test/e2e";

// Los usuarios de tareas los vacía TareaRouter.e2e: aquí emails propios, sin vaciar.
describe("Vista de pendientes (e2e)", () => {
	let eva: string;

	const crear = (token: string, body: Record<string, unknown>) =>
		api("/api/tareas", { method: "POST", token, body }).then((r) => r.json());

	beforeAll(async () => {
		await crearUsuario("eva@pendientes.dev", "USUARIO");
		await crearUsuario("otro@pendientes.dev", "USUARIO");
		eva = await login("eva@pendientes.dev");
		const otro = await login("otro@pendientes.dev");

		await crear(eva, { titulo: "Sin fecha" });
		await crear(eva, { titulo: "Día 20", fechaVencimiento: "2026-11-20" });
		await crear(eva, {
			titulo: "Día 10 baja",
			prioridad: "baja",
			fechaVencimiento: "2026-11-10",
		});
		await crear(eva, {
			titulo: "Día 10 alta, en progreso",
			prioridad: "alta",
			estado: "en_progreso",
			fechaVencimiento: "2026-11-10",
		});
		await crear(eva, {
			titulo: "Completada",
			estado: "completada",
			fechaVencimiento: "2026-11-01",
		});
		await crear(eva, { titulo: "Cancelada", estado: "cancelada" });
		const borrada = await crear(eva, {
			titulo: "Borrada",
			fechaVencimiento: "2026-11-01",
		});
		await api(`/api/tareas/${borrada.id}`, { method: "DELETE", token: eva });
		await crear(otro, { titulo: "De otro", fechaVencimiento: "2026-11-01" });
	});

	it("ordena por vencimiento, luego prioridad, y deja las sin fecha al final", async () => {
		const res = await api("/api/tareas/pendientes", { token: eva });
		expect(res.status).toBe(200);
		const { datos, totalElementos } = await res.json();

		expect(datos.map((t: { titulo: string }) => t.titulo)).toEqual([
			"Día 10 alta, en progreso",
			"Día 10 baja",
			"Día 20",
			"Sin fecha",
		]);
		expect(totalElementos).toBe(4);
	});

	it("pagina", async () => {
		const { datos, totalPaginas } = await (
			await api("/api/tareas/pendientes?pagina=2&limite=3", { token: eva })
		).json();

		expect(datos.map((t: { titulo: string }) => t.titulo)).toEqual([
			"Sin fecha",
		]);
		expect(totalPaginas).toBe(2);
	});
});
