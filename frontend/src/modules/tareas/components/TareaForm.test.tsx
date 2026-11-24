// @vitest-environment happy-dom
import { cleanup, fireEvent, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderConQuery } from "@/test/renderConQuery";
import type { TareaDto } from "../api/tareasApi";

const { mocksTareasApi, mocksToast } = vi.hoisted(() => ({
	mocksTareasApi: {
		obtenerTodos: vi.fn(),
		crear: vi.fn(),
		actualizar: vi.fn(),
	},
	mocksToast: {
		success: vi.fn(),
		error: vi.fn(),
	},
}));

vi.mock("../api/tareasApi", async (importOriginal) => {
	const actual = await importOriginal<typeof import("../api/tareasApi")>();
	return {
		...actual,
		tareasApi: {
			...actual.tareasApi,
			...mocksTareasApi,
		},
	};
});
vi.mock("sonner", () => ({ toast: mocksToast }));
vi.mock("./EditorTarea", () => ({
	EditorTarea: () => <div data-testid="editor-tarea-stub" />,
}));
vi.mock("@/modules/tags/components/SelectorTags", () => ({
	SelectorTags: () => <div data-testid="selector-tags-stub" />,
}));
vi.mock("./CampoResponsables", () => ({
	CampoResponsables: () => <div data-testid="campo-responsables-stub" />,
}));
vi.mock("./MoverTareaDialog", () => ({
	MoverTareaDialog: () => null,
}));

import { TareaForm } from "./TareaForm";

const tareaInicial: TareaDto = {
	id: 42,
	titulo: "Revisar arquitectura",
	contenido: "Notas previas",
	estado: "en_progreso",
	prioridad: "alta",
	fechaInicio: "2026-12-01",
	fechaVencimiento: "2026-12-05",
	color: "#6366f1",
	isFijada: false,
	tagIds: [1],
	organizacionId: 5,
	equipoId: null,
	proyectoId: 9,
	responsableIds: [2, 3],
	asignadoPor: {},
	dependeDeId: null,
	recurrencia: null,
	subtareas: [],
	bloqueada: false,
};

describe("TareaForm", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mocksTareasApi.obtenerTodos.mockResolvedValue({
			datos: [],
			pagina: 1,
			totalElementos: 0,
			totalPaginas: 1,
		});
	});

	afterEach(() => cleanup());

	it("exige título y valida que el vencimiento no sea anterior al inicio", async () => {
		const onGuardado = vi.fn();
		renderConQuery(<TareaForm onGuardado={onGuardado} onVolver={vi.fn()} />);

		fireEvent.change(screen.getByLabelText("Inicio"), {
			target: { value: "2026-12-10" },
		});
		fireEvent.change(screen.getByLabelText("Vencimiento"), {
			target: { value: "2026-12-01" },
		});
		fireEvent.click(screen.getByRole("button", { name: /^Crear/ }));

		await waitFor(() => {
			expect(screen.getByText("Obligatorio")).toBeTruthy();
			expect(
				screen.getByText("Debe ser igual o posterior al inicio"),
			).toBeTruthy();
		});
		expect(mocksTareasApi.crear).not.toHaveBeenCalled();
		expect(onGuardado).not.toHaveBeenCalled();
	});

	it("crea una tarea personal sin enviar destino ni responsableIds", async () => {
		mocksTareasApi.crear.mockResolvedValue({ ...tareaInicial, id: 99 });
		const onGuardado = vi.fn();

		renderConQuery(<TareaForm onGuardado={onGuardado} onVolver={vi.fn()} />);

		fireEvent.change(screen.getByLabelText("Título"), {
			target: { value: "  Comprar pan  " },
		});
		fireEvent.click(screen.getByRole("button", { name: /^Crear/ }));

		await waitFor(() => {
			expect(mocksTareasApi.crear).toHaveBeenCalledWith(
				expect.objectContaining({
					titulo: "Comprar pan",
					estado: "pendiente",
					prioridad: "media",
					color: null,
					dependeDeId: null,
					recurrencia: null,
				}),
				expect.anything(),
			);
		});

		const payload = mocksTareasApi.crear.mock.calls[0]?.[0];
		expect(payload).not.toHaveProperty("responsableIds");
		expect(payload).not.toHaveProperty("organizacionId");
		expect(onGuardado).toHaveBeenCalledTimes(1);
	});

	it("incluye el destino y responsableIds al crear dentro de un proyecto", async () => {
		mocksTareasApi.crear.mockResolvedValue({ ...tareaInicial, id: 100 });
		const onGuardado = vi.fn();

		renderConQuery(
			<TareaForm
				contexto={{ organizacionId: 5, proyectoId: 9 }}
				onGuardado={onGuardado}
				onVolver={vi.fn()}
			/>,
		);

		fireEvent.change(screen.getByLabelText("Título"), {
			target: { value: "Tarea de proyecto" },
		});
		fireEvent.click(screen.getByRole("button", { name: /^Crear/ }));

		await waitFor(() => {
			expect(mocksTareasApi.crear).toHaveBeenCalledWith(
				expect.objectContaining({
					titulo: "Tarea de proyecto",
					proyectoId: 9,
					responsableIds: [],
				}),
				expect.anything(),
			);
		});
		expect(onGuardado).toHaveBeenCalledTimes(1);
	});

	it("edita la tarea sin reenviar responsableIds si no cambiaron", async () => {
		mocksTareasApi.actualizar.mockResolvedValue({
			...tareaInicial,
			titulo: "Arquitectura revisada",
		});
		const onGuardado = vi.fn();

		renderConQuery(
			<TareaForm
				inicial={tareaInicial}
				onGuardado={onGuardado}
				onVolver={vi.fn()}
			/>,
		);

		const inputTitulo = screen.getByLabelText("Título") as HTMLInputElement;
		expect(inputTitulo.value).toBe("Revisar arquitectura");

		fireEvent.change(inputTitulo, {
			target: { value: "Arquitectura revisada" },
		});
		fireEvent.click(screen.getByRole("button", { name: /^Guardar/ }));

		await waitFor(() => {
			expect(mocksTareasApi.actualizar).toHaveBeenCalledWith(
				42,
				expect.objectContaining({
					titulo: "Arquitectura revisada",
					estado: "en_progreso",
					prioridad: "alta",
				}),
			);
		});

		const datosActualizados = mocksTareasApi.actualizar.mock.calls[0]?.[1];
		expect(datosActualizados).not.toHaveProperty("responsableIds");
		expect(onGuardado).toHaveBeenCalledTimes(1);
	});
});
