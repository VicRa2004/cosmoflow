import { beforeAll, describe, expect, it } from "bun:test";
import { prisma } from "@/core/config/prisma";
import { api, crearUsuario, login, PASSWORD, vaciarUsuarios } from "@/test/e2e";

describe("Datos de la cuenta (e2e)", () => {
	let ana: { id: number };
	let token: string;
	let org: { id: number };
	let compartida: { id: number };
	let personal: { id: number };

	beforeAll(async () => {
		await vaciarUsuarios();
		ana = await crearUsuario("ana.baja@e2e.dev", "USUARIO");
		const bea = await crearUsuario("bea.baja@e2e.dev", "USUARIO");
		org = await prisma.organizacion.create({
			data: {
				nombre: "Acme Baja",
				color: "#112233",
				miembros: {
					create: [{ usuarioId: ana.id, isAdmin: true }, { usuarioId: bea.id }],
				},
			},
		});
		compartida = await prisma.tarea.create({
			data: { usuarioId: ana.id, titulo: "Compartida", organizacionId: org.id },
		});
		personal = await prisma.tarea.create({
			data: {
				usuarioId: ana.id,
				titulo: "Personal",
				subtareas: { create: { titulo: "Paso 1" } },
			},
		});
		await prisma.nota.create({
			data: { usuarioId: ana.id, titulo: "Diario", contenido: "# Hola" },
		});
		token = await login("ana.baja@e2e.dev");
	});

	it("exporta las tareas y notas que creó", async () => {
		const res = await api("/api/cuenta/exportacion", { token });
		expect(res.status).toBe(200);
		const datos = await res.json();
		expect(datos.tareas.map((t: { titulo: string }) => t.titulo)).toEqual([
			"Compartida",
			"Personal",
		]);
		expect(datos.tareas[1].subtareas).toEqual([
			{ titulo: "Paso 1", completada: false },
		]);
		expect(datos.notas[0]).toMatchObject({
			titulo: "Diario",
			contenido: "# Hola",
		});
	});

	it("rechaza la baja con una contraseña incorrecta", async () => {
		const res = await api("/api/cuenta", {
			method: "DELETE",
			token,
			body: { password: "otra" },
		});
		expect(res.status).toBe(400);
	});

	it("impide la baja al único administrador de una organización", async () => {
		const res = await api("/api/cuenta", {
			method: "DELETE",
			token,
			body: { password: PASSWORD },
		});
		expect(res.status).toBe(409);
		expect((await res.json()).error).toContain("Acme Baja");
	});

	it("borra lo personal, conserva lo compartido y anonimiza la cuenta", async () => {
		await prisma.miembroOrganizacion.updateMany({
			where: { organizacionId: org.id },
			data: { isAdmin: true },
		});

		const res = await api("/api/cuenta", {
			method: "DELETE",
			token,
			body: { password: PASSWORD },
		});
		expect(res.status).toBe(204);

		expect(
			await prisma.tarea.findUnique({ where: { id: personal.id } }),
		).toBeNull();
		expect(await prisma.nota.count({ where: { usuarioId: ana.id } })).toBe(0);
		expect(
			await prisma.tarea.findUnique({ where: { id: compartida.id } }),
		).not.toBeNull();
		expect(
			await prisma.miembroOrganizacion.count({ where: { usuarioId: ana.id } }),
		).toBe(0);
		const fila = await prisma.usuario.findUniqueOrThrow({
			where: { id: ana.id },
		});
		expect(fila).toMatchObject({
			nombre: "Usuario eliminado",
			isActivo: false,
		});
		expect(fila.deletedAt).not.toBeNull();

		// El email queda libre para una cuenta nueva.
		await crearUsuario("ana.baja@e2e.dev");
	});
});
