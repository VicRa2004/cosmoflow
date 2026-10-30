import { beforeEach, describe, expect, it } from "bun:test";
import { prisma } from "@/core/config/prisma";
import { crearUsuario, vaciarUsuarios } from "@/test/e2e";
import { PrismaVinculoTelegramRepository } from "./PrismaVinculoTelegramRepository";

const repo = new PrismaVinculoTelegramRepository();
const enUnRato = () => new Date(Date.now() + 60_000);

describe("PrismaVinculoTelegramRepository (e2e)", () => {
	let ana: number;
	let beto: number;

	beforeEach(async () => {
		await vaciarUsuarios();
		ana = (await crearUsuario("ana@telegram.dev")).id;
		beto = (await crearUsuario("beto@telegram.dev")).id;
	});

	it("vincula con el token una sola vez", async () => {
		await repo.guardarToken(ana, "hash-ana", enUnRato());

		expect(await repo.vincularPorToken("hash-ana", "42")).toBe(true);
		expect(await repo.estaVinculado(ana)).toBe(true);
		expect(await repo.vincularPorToken("hash-ana", "43")).toBe(false);
	});

	it("no vincula con un token caducado", async () => {
		await repo.guardarToken(ana, "hash-ana", new Date(Date.now() - 1000));

		expect(await repo.vincularPorToken("hash-ana", "42")).toBe(false);
		expect(await repo.estaVinculado(ana)).toBe(false);
	});

	it("un chat solo avisa a una cuenta: vincularlo a otra lo quita de la anterior", async () => {
		await repo.guardarToken(ana, "hash-ana", enUnRato());
		await repo.vincularPorToken("hash-ana", "42");
		await repo.guardarToken(beto, "hash-beto", enUnRato());
		await repo.vincularPorToken("hash-beto", "42");

		expect(await repo.estaVinculado(ana)).toBe(false);
		expect(await repo.estaVinculado(beto)).toBe(true);
	});

	it("desvincular borra el vínculo", async () => {
		await repo.guardarToken(ana, "hash-ana", enUnRato());
		await repo.vincularPorToken("hash-ana", "42");
		await repo.desvincular(ana);

		expect(await repo.estaVinculado(ana)).toBe(false);
		expect(await prisma.vinculoTelegram.count()).toBe(0);
	});
});
