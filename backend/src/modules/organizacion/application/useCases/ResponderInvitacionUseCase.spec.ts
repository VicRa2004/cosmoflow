import { describe, expect, it, mock } from "bun:test";
import { InvitacionDeOtroEmailError } from "../../domain/error/InvitacionDeOtroEmailError";
import { InvitacionNoVigenteError } from "../../domain/error/InvitacionNoVigenteError";
import { Invitacion } from "../../domain/Invitacion";
import { hashearToken } from "../services/EmisorInvitaciones";
import { ResponderInvitacionUseCase } from "./ResponderInvitacionUseCase";

const TOKEN = "a".repeat(64);
const DIA = 24 * 60 * 60 * 1000;

const preparar = (expiraEn = new Date(Date.now() + DIA)) => {
	const invitacion = Invitacion.reconstituir(3, {
		organizacionId: 1,
		email: "beto@x.com",
		tokenHash: hashearToken(TOKEN),
		estado: "pendiente",
		expiraEn,
		createdAt: new Date(),
	});
	const organizaciones = { agregarMiembro: mock(async () => {}) };
	const invitaciones = {
		buscarPorTokenHash: mock(async (hash: string) =>
			hash === invitacion.getTokenHash()
				? { invitacion, nombreOrganizacion: "Acme" }
				: null,
		),
		actualizar: mock(async (i: Invitacion) => i),
	};
	const uow = { ejecutar: <T>(fn: () => Promise<T>) => fn() };
	const useCase = new ResponderInvitacionUseCase(
		organizaciones as never,
		invitaciones as never,
		uow,
	);
	return { useCase, invitacion, organizaciones };
};

describe("ResponderInvitacionUseCase", () => {
	it("aceptar crea el miembro y gasta el enlace", async () => {
		const { useCase, invitacion, organizaciones } = preparar();

		const res = await useCase.ejecutar(
			{ id: 9, email: "Beto@X.com" },
			TOKEN,
			true,
		);

		expect(res).toEqual({ organizacionId: 1 });
		expect(organizaciones.agregarMiembro).toHaveBeenCalledWith(1, 9);
		expect(invitacion.getEstado()).toBe("aceptada");
	});

	it("rechazar no crea el miembro", async () => {
		const { useCase, invitacion, organizaciones } = preparar();
		await useCase.ejecutar({ id: 9, email: "beto@x.com" }, TOKEN, false);
		expect(organizaciones.agregarMiembro).not.toHaveBeenCalled();
		expect(invitacion.getEstado()).toBe("rechazada");
	});

	it("solo la cuenta con el email invitado puede responder", async () => {
		const { useCase, organizaciones } = preparar();
		expect(
			useCase.ejecutar({ id: 9, email: "otro@x.com" }, TOKEN, true),
		).rejects.toThrow(InvitacionDeOtroEmailError);
		expect(organizaciones.agregarMiembro).not.toHaveBeenCalled();
	});

	it("una invitación caducada no se puede aceptar", async () => {
		const { useCase, organizaciones } = preparar(new Date(Date.now() - 1));
		expect(
			useCase.ejecutar({ id: 9, email: "beto@x.com" }, TOKEN, true),
		).rejects.toThrow(InvitacionNoVigenteError);
		expect(organizaciones.agregarMiembro).not.toHaveBeenCalled();
	});
});
