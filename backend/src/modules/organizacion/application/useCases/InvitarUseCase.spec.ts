import { describe, expect, it, mock } from "bun:test";
import { InvitacionDuplicadaError } from "../../domain/error/InvitacionDuplicadaError";
import { YaEsMiembroError } from "../../domain/error/YaEsMiembroError";
import { Invitacion } from "../../domain/Invitacion";
import { Organizacion } from "../../domain/Organizacion";
import {
	EmisorInvitaciones,
	hashearToken,
} from "../services/EmisorInvitaciones";
import { InvitarUseCase } from "./InvitarUseCase";

const preparar = ({ miembro = false, pendiente = false } = {}) => {
	const organizaciones = {
		buscarPorId: mock(async () => ({
			organizacion: Organizacion.reconstituir(1, {
				nombre: "Acme",
				descripcion: "",
				color: "#6366f1",
				avatar: null,
			}),
			isAdmin: true,
		})),
		esMiembroPorEmail: mock(async () => miembro),
	};
	const invitaciones = {
		buscarPendientePorEmail: mock(async () => (pendiente ? {} : null)),
		crear: mock(async (i: Invitacion) =>
			Invitacion.reconstituir(3, {
				organizacionId: i.getOrganizacionId(),
				email: i.getEmail(),
				tokenHash: i.getTokenHash(),
				estado: i.getEstado(),
				expiraEn: i.getExpiraEn(),
				createdAt: i.getCreatedAt(),
			}),
		),
	};
	const mailer = { enviar: mock(async () => {}) };
	const useCase = new InvitarUseCase(
		organizaciones as never,
		invitaciones as never,
		new EmisorInvitaciones(mailer, "https://app.test"),
	);
	return { useCase, invitaciones, mailer };
};

describe("InvitarUseCase", () => {
	it("guarda solo el hash y envía el token en claro por correo", async () => {
		const { useCase, invitaciones, mailer } = preparar();

		const dto = await useCase.ejecutar(7, 1, "beto@x.com");

		const guardada = invitaciones.crear.mock.calls[0]?.[0] as Invitacion;
		const { para, texto } = (
			mailer.enviar.mock.calls[0] as unknown as [
				{ para: string; texto: string },
			]
		)[0];
		const token = texto.match(/token=([a-f0-9]{64})/)?.[1] ?? "";
		expect(para).toBe("beto@x.com");
		expect(guardada.getTokenHash()).toBe(hashearToken(token));
		expect(texto).toContain("https://app.test/invitacion?token=");
		expect(dto).toMatchObject({ email: "beto@x.com", isCaducada: false });
	});

	it("no invita a quien ya es miembro", async () => {
		const { useCase, mailer } = preparar({ miembro: true });
		expect(useCase.ejecutar(7, 1, "beto@x.com")).rejects.toThrow(
			YaEsMiembroError,
		);
		expect(mailer.enviar).not.toHaveBeenCalled();
	});

	it("no duplica una invitación pendiente", async () => {
		const { useCase, mailer } = preparar({ pendiente: true });
		expect(useCase.ejecutar(7, 1, "beto@x.com")).rejects.toThrow(
			InvitacionDuplicadaError,
		);
		expect(mailer.enviar).not.toHaveBeenCalled();
	});
});
