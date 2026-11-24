// @vitest-environment happy-dom
import { cleanup, fireEvent, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderConQuery } from "@/test/renderConQuery";
import type { OrganizacionDto } from "../api/organizacionesApi";

const { mocksOrgApi, mocksToast } = vi.hoisted(() => ({
	mocksOrgApi: {
		crear: vi.fn(),
		actualizar: vi.fn(),
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

import { OrganizacionForm } from "./OrganizacionForm";

const orgEjemplo: OrganizacionDto = {
	id: 12,
	nombre: "Cosmoflow Lab",
	descripcion: "Equipo principal",
	color: "#10b981",
	avatarUrl: null,
	isAdmin: true,
	permisos: ["organizacion:editar"],
};

describe("OrganizacionForm", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	afterEach(() => cleanup());

	it("muestra error de validación si el nombre está vacío sin llamar a la API", async () => {
		const onGuardado = vi.fn();
		renderConQuery(<OrganizacionForm onGuardado={onGuardado} />);

		fireEvent.click(screen.getByRole("button", { name: "Crear" }));

		await waitFor(() => {
			expect(screen.getByText("Obligatorio")).toBeTruthy();
		});
		expect(mocksOrgApi.crear).not.toHaveBeenCalled();
		expect(onGuardado).not.toHaveBeenCalled();
	});

	it("crea una organización con datos válidos y ejecuta onGuardado", async () => {
		mocksOrgApi.crear.mockResolvedValue(orgEjemplo);
		const onGuardado = vi.fn();
		renderConQuery(<OrganizacionForm onGuardado={onGuardado} />);

		fireEvent.change(screen.getByLabelText("Nombre"), {
			target: { value: "  Cosmoflow Lab  " },
		});
		fireEvent.change(screen.getByLabelText("Descripción (opcional)"), {
			target: { value: "  Equipo principal  " },
		});
		fireEvent.click(screen.getByRole("button", { name: "Crear" }));

		await waitFor(() => {
			expect(mocksOrgApi.crear).toHaveBeenCalledWith(
				{
					nombre: "Cosmoflow Lab",
					descripcion: "Equipo principal",
					color: "#6366f1",
				},
				expect.anything(),
			);
		});
		expect(onGuardado).toHaveBeenCalledWith(orgEjemplo);
	});

	it("precarga datos en modo edición y llama a actualizar", async () => {
		const actualizada = { ...orgEjemplo, nombre: "Cosmoflow Core" };
		mocksOrgApi.actualizar.mockResolvedValue(actualizada);
		const onGuardado = vi.fn();

		renderConQuery(
			<OrganizacionForm inicial={orgEjemplo} onGuardado={onGuardado} />,
		);

		const inputNombre = screen.getByLabelText("Nombre") as HTMLInputElement;
		expect(inputNombre.value).toBe("Cosmoflow Lab");

		fireEvent.change(inputNombre, { target: { value: "Cosmoflow Core" } });
		fireEvent.click(screen.getByRole("button", { name: "Guardar" }));

		await waitFor(() => {
			expect(mocksOrgApi.actualizar).toHaveBeenCalledWith(12, {
				nombre: "Cosmoflow Core",
				descripcion: "Equipo principal",
				color: "#10b981",
			});
		});
		expect(onGuardado).toHaveBeenCalledWith(actualizada);
	});
});
