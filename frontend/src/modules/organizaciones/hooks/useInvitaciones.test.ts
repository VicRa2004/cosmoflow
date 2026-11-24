// @vitest-environment happy-dom
import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { crearQueryClientTest, crearWrapperQuery } from "@/test/renderConQuery";

const { mocksInvitacionesApi, mocksToast } = vi.hoisted(() => ({
	mocksInvitacionesApi: {
		invitar: vi.fn(),
		reenviar: vi.fn(),
		cancelar: vi.fn(),
		responder: vi.fn(),
	},
	mocksToast: {
		success: vi.fn(),
		error: vi.fn(),
	},
}));

vi.mock("../api/invitacionesApi", () => ({
	invitacionesApi: mocksInvitacionesApi,
}));
vi.mock("sonner", () => ({ toast: mocksToast }));

import {
	useGestionInvitaciones,
	useResponderInvitacionMutation,
} from "./useInvitaciones";
import { organizacionesKeys } from "./useOrganizacionesQuery";

describe("hooks de invitaciones de organización", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("useGestionInvitaciones permite invitar, reenviar y cancelar refrescando pendientes", async () => {
		const queryClient = crearQueryClientTest();
		const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");
		const keyInvitaciones = [...organizacionesKeys.detalle(7), "invitaciones"];

		mocksInvitacionesApi.invitar.mockResolvedValue({
			id: 1,
			email: "beto@ejemplo.com",
		});
		mocksInvitacionesApi.reenviar.mockResolvedValue({
			id: 1,
			email: "beto@ejemplo.com",
		});
		mocksInvitacionesApi.cancelar.mockResolvedValue(undefined);

		const { result } = renderHook(() => useGestionInvitaciones(7), {
			wrapper: crearWrapperQuery(queryClient),
		});

		await result.current.invitar.mutateAsync("beto@ejemplo.com");
		expect(mocksInvitacionesApi.invitar).toHaveBeenCalledWith(
			7,
			"beto@ejemplo.com",
		);
		expect(mocksToast.success).toHaveBeenCalledWith(
			"Invitación enviada a beto@ejemplo.com",
		);
		expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: keyInvitaciones });

		await result.current.reenviar.mutateAsync(1);
		expect(mocksInvitacionesApi.reenviar).toHaveBeenCalledWith(7, 1);
		expect(mocksToast.success).toHaveBeenCalledWith(
			"Invitación reenviada a beto@ejemplo.com",
		);

		await result.current.cancelar.mutateAsync(1);
		expect(mocksInvitacionesApi.cancelar).toHaveBeenCalledWith(7, 1);
		expect(mocksToast.success).toHaveBeenCalledWith("Invitación cancelada");
	});

	it("useResponderInvitacionMutation responde e invalida la lista de organizaciones", async () => {
		const queryClient = crearQueryClientTest();
		const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");
		mocksInvitacionesApi.responder.mockResolvedValue({ organizacionId: 7 });

		const { result } = renderHook(() => useResponderInvitacionMutation(), {
			wrapper: crearWrapperQuery(queryClient),
		});

		await result.current.mutateAsync({ token: "tok-inv", aceptar: true });

		expect(mocksInvitacionesApi.responder).toHaveBeenCalledWith(
			"tok-inv",
			true,
		);
		expect(invalidateSpy).toHaveBeenCalledWith({
			queryKey: organizacionesKeys.lists(),
		});
	});

	it("muestra toast.error si invitar falla", async () => {
		mocksInvitacionesApi.invitar.mockRejectedValue(
			new Error("Ya pertenece a la organización"),
		);

		const { result } = renderHook(() => useGestionInvitaciones(7), {
			wrapper: crearWrapperQuery(),
		});

		result.current.invitar.mutate("beto@ejemplo.com");

		await waitFor(() => {
			expect(mocksToast.error).toHaveBeenCalledWith(
				"Ya pertenece a la organización",
			);
		});
	});
});
