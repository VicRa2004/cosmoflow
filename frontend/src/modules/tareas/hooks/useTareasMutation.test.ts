// @vitest-environment happy-dom
import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { crearQueryClientTest, crearWrapperQuery } from "@/test/renderConQuery";

const { mocksTareasApi, mocksToast } = vi.hoisted(() => ({
	mocksTareasApi: {
		crear: vi.fn(),
		actualizar: vi.fn(),
		eliminar: vi.fn(),
		mover: vi.fn(),
		duplicar: vi.fn(),
		accionLote: vi.fn(),
		eliminarLote: vi.fn(),
	},
	mocksToast: {
		success: vi.fn(),
		error: vi.fn(),
	},
}));

vi.mock("../api/tareasApi", () => ({ tareasApi: mocksTareasApi }));
vi.mock("sonner", () => ({ toast: mocksToast }));

import {
	useAccionLoteTareasMutation,
	useActualizarTareaMutation,
	useCrearTareaMutation,
	useDuplicarTareaMutation,
	useEliminarLoteTareasMutation,
	useEliminarTareaMutation,
	useFijarTareaMutation,
	useMoverTareaMutation,
} from "./useTareasMutation";
import { tareasKeys } from "./useTareasQuery";

describe("hooks de mutación de tareas", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("useCrearTareaMutation crea la tarea, notifica e invalida la caché", async () => {
		const queryClient = crearQueryClientTest();
		const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");
		mocksTareasApi.crear.mockResolvedValue({ id: 10, titulo: "Nueva" });

		const { result } = renderHook(() => useCrearTareaMutation(), {
			wrapper: crearWrapperQuery(queryClient),
		});

		await result.current.mutateAsync({
			titulo: "Nueva",
			contenido: "",
			estado: "pendiente",
			prioridad: "media",
		});

		expect(mocksTareasApi.crear).toHaveBeenCalledTimes(1);
		expect(mocksToast.success).toHaveBeenCalledWith("Tarea creada");
		expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: tareasKeys.all });
	});

	it("useActualizarTareaMutation actualiza, notifica e invalida la caché", async () => {
		const queryClient = crearQueryClientTest();
		const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");
		mocksTareasApi.actualizar.mockResolvedValue({
			id: 5,
			estado: "completada",
		});

		const { result } = renderHook(() => useActualizarTareaMutation(), {
			wrapper: crearWrapperQuery(queryClient),
		});

		await result.current.mutateAsync({
			id: 5,
			datos: { estado: "completada" },
		});

		expect(mocksTareasApi.actualizar).toHaveBeenCalledWith(5, {
			estado: "completada",
		});
		expect(mocksToast.success).toHaveBeenCalledWith("Tarea guardada");
		expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: tareasKeys.all });
	});

	it("useEliminarTareaMutation elimina y notifica éxito", async () => {
		const queryClient = crearQueryClientTest();
		const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");
		mocksTareasApi.eliminar.mockResolvedValue(undefined);

		const { result } = renderHook(() => useEliminarTareaMutation(), {
			wrapper: crearWrapperQuery(queryClient),
		});

		await result.current.mutateAsync(8);

		expect(mocksTareasApi.eliminar).toHaveBeenCalledWith(8, expect.anything());
		expect(mocksToast.success).toHaveBeenCalledWith("Tarea eliminada");
		expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: tareasKeys.all });
	});

	it("useMoverTareaMutation y useDuplicarTareaMutation llaman a la API y muestran toast", async () => {
		mocksTareasApi.mover.mockResolvedValue({ id: 3 });
		mocksTareasApi.duplicar.mockResolvedValue({ id: 4 });

		const mover = renderHook(() => useMoverTareaMutation(), {
			wrapper: crearWrapperQuery(),
		});
		await mover.result.current.mutateAsync({
			id: 3,
			destino: { proyectoId: 2 },
		});

		expect(mocksTareasApi.mover).toHaveBeenCalledWith(3, { proyectoId: 2 });
		expect(mocksToast.success).toHaveBeenCalledWith("Tarea movida");

		const duplicar = renderHook(() => useDuplicarTareaMutation(), {
			wrapper: crearWrapperQuery(),
		});
		await duplicar.result.current.mutateAsync(3);

		expect(mocksTareasApi.duplicar).toHaveBeenCalledWith(3, expect.anything());
		expect(mocksToast.success).toHaveBeenCalledWith("Tarea duplicada");
	});

	it("useFijarTareaMutation distingue fijar y desfijar en la notificación", async () => {
		mocksTareasApi.actualizar.mockResolvedValue({ id: 9 });

		const { result } = renderHook(() => useFijarTareaMutation(), {
			wrapper: crearWrapperQuery(),
		});

		await result.current.mutateAsync({ id: 9, isFijada: true });
		expect(mocksTareasApi.actualizar).toHaveBeenCalledWith(9, {
			isFijada: true,
		});
		expect(mocksToast.success).toHaveBeenCalledWith("Tarea fijada");

		await result.current.mutateAsync({ id: 9, isFijada: false });
		expect(mocksToast.success).toHaveBeenCalledWith("Tarea desfijada");
	});

	it("useAccionLoteTareasMutation y useEliminarLoteTareasMutation pluralizan el mensaje", async () => {
		mocksTareasApi.accionLote
			.mockResolvedValueOnce({ afectadas: 1 })
			.mockResolvedValueOnce({ afectadas: 3 });
		mocksTareasApi.eliminarLote
			.mockResolvedValueOnce({ afectadas: 1 })
			.mockResolvedValueOnce({ afectadas: 2 });

		const accion = renderHook(() => useAccionLoteTareasMutation(), {
			wrapper: crearWrapperQuery(),
		});
		await accion.result.current.mutateAsync({
			ids: [1],
			accion: "estado",
			estado: "completada",
		});
		expect(mocksToast.success).toHaveBeenCalledWith("1 tarea actualizada");

		await accion.result.current.mutateAsync({
			ids: [1, 2, 3],
			accion: "estado",
			estado: "completada",
		});
		expect(mocksToast.success).toHaveBeenCalledWith("3 tareas actualizadas");

		const eliminar = renderHook(() => useEliminarLoteTareasMutation(), {
			wrapper: crearWrapperQuery(),
		});
		await eliminar.result.current.mutateAsync([1]);
		expect(mocksToast.success).toHaveBeenCalledWith(
			"1 tarea movida a la papelera",
		);

		await eliminar.result.current.mutateAsync([1, 2]);
		expect(mocksToast.success).toHaveBeenCalledWith(
			"2 tareas movidas a la papelera",
		);
	});

	it("muestra toast.error si la petición falla", async () => {
		mocksTareasApi.crear.mockRejectedValue(new Error("Sin permisos"));

		const { result } = renderHook(() => useCrearTareaMutation(), {
			wrapper: crearWrapperQuery(),
		});

		result.current.mutate({
			titulo: "Fallida",
			contenido: "",
			estado: "pendiente",
			prioridad: "media",
		});

		await waitFor(() => {
			expect(mocksToast.error).toHaveBeenCalledWith("Sin permisos");
		});
	});
});
