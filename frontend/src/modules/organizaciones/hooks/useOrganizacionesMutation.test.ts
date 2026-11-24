// @vitest-environment happy-dom
import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { crearQueryClientTest, crearWrapperQuery } from "@/test/renderConQuery";

const { mocksOrgApi, mocksToast } = vi.hoisted(() => ({
	mocksOrgApi: {
		crear: vi.fn(),
		actualizar: vi.fn(),
		subirAvatar: vi.fn(),
		eliminarAvatar: vi.fn(),
		eliminar: vi.fn(),
	},
	mocksToast: {
		success: vi.fn(),
		error: vi.fn(),
	},
}));

vi.mock("../api/organizacionesApi", () => ({
	organizacionesApi: mocksOrgApi,
}));
vi.mock("sonner", () => ({ toast: mocksToast }));

import {
	useActualizarOrganizacionMutation,
	useAvatarOrganizacionMutation,
	useCrearOrganizacionMutation,
	useEliminarOrganizacionMutation,
} from "./useOrganizacionesMutation";
import { organizacionesKeys } from "./useOrganizacionesQuery";

const orgBase = {
	id: 3,
	nombre: "Acme",
	descripcion: "Producto",
	color: "#6366f1",
	avatarUrl: null,
	isAdmin: true,
	permisos: ["organizacion:editar"],
};

describe("hooks de mutación de organizaciones", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("useCrearOrganizacionMutation guarda en caché el detalle, invalida listas y notifica", async () => {
		const queryClient = crearQueryClientTest();
		const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");
		mocksOrgApi.crear.mockResolvedValue(orgBase);

		const { result } = renderHook(() => useCrearOrganizacionMutation(), {
			wrapper: crearWrapperQuery(queryClient),
		});

		await result.current.mutateAsync({
			nombre: "Acme",
			descripcion: "Producto",
			color: "#6366f1",
		});

		expect(mocksOrgApi.crear).toHaveBeenCalledTimes(1);
		expect(queryClient.getQueryData(organizacionesKeys.detalle(3))).toEqual(
			orgBase,
		);
		expect(invalidateSpy).toHaveBeenCalledWith({
			queryKey: organizacionesKeys.lists(),
		});
		expect(mocksToast.success).toHaveBeenCalledWith("Organización creada");
	});

	it("useActualizarOrganizacionMutation actualiza el detalle en caché e invalida listas", async () => {
		const queryClient = crearQueryClientTest();
		const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");
		const orgActualizada = { ...orgBase, nombre: "Acme Corp" };
		mocksOrgApi.actualizar.mockResolvedValue(orgActualizada);

		const { result } = renderHook(() => useActualizarOrganizacionMutation(), {
			wrapper: crearWrapperQuery(queryClient),
		});

		await result.current.mutateAsync({
			id: 3,
			datos: { nombre: "Acme Corp", descripcion: "Producto", color: "#6366f1" },
		});

		expect(mocksOrgApi.actualizar).toHaveBeenCalledWith(3, {
			nombre: "Acme Corp",
			descripcion: "Producto",
			color: "#6366f1",
		});
		expect(queryClient.getQueryData(organizacionesKeys.detalle(3))).toEqual(
			orgActualizada,
		);
		expect(invalidateSpy).toHaveBeenCalledWith({
			queryKey: organizacionesKeys.lists(),
		});
		expect(mocksToast.success).toHaveBeenCalledWith("Organización guardada");
	});

	it("useAvatarOrganizacionMutation sube archivo o elimina avatar según el argumento", async () => {
		const queryClient = crearQueryClientTest();
		const archivo = new File(["img"], "logo.png", { type: "image/png" });
		mocksOrgApi.subirAvatar.mockResolvedValue({
			...orgBase,
			avatarUrl: "/api/organizaciones/3/avatar",
		});
		mocksOrgApi.eliminarAvatar.mockResolvedValue(orgBase);

		const { result } = renderHook(() => useAvatarOrganizacionMutation(3), {
			wrapper: crearWrapperQuery(queryClient),
		});

		await result.current.mutateAsync(archivo);
		expect(mocksOrgApi.subirAvatar).toHaveBeenCalledWith(3, archivo);

		await result.current.mutateAsync(null);
		expect(mocksOrgApi.eliminarAvatar).toHaveBeenCalledWith(3);
	});

	it("useEliminarOrganizacionMutation elimina, invalida listas y muestra toast", async () => {
		const queryClient = crearQueryClientTest();
		const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");
		mocksOrgApi.eliminar.mockResolvedValue(undefined);

		const { result } = renderHook(() => useEliminarOrganizacionMutation(), {
			wrapper: crearWrapperQuery(queryClient),
		});

		await result.current.mutateAsync(3);

		expect(mocksOrgApi.eliminar).toHaveBeenCalledWith(3, expect.anything());
		expect(invalidateSpy).toHaveBeenCalledWith({
			queryKey: organizacionesKeys.lists(),
		});
		expect(mocksToast.success).toHaveBeenCalledWith("Organización eliminada");
	});

	it("muestra toast.error cuando falla la mutación", async () => {
		mocksOrgApi.crear.mockRejectedValue(new Error("Nombre duplicado"));

		const { result } = renderHook(() => useCrearOrganizacionMutation(), {
			wrapper: crearWrapperQuery(),
		});

		result.current.mutate({
			nombre: "Acme",
			descripcion: "",
			color: "#6366f1",
		});

		await waitFor(() => {
			expect(mocksToast.error).toHaveBeenCalledWith("Nombre duplicado");
		});
	});
});
