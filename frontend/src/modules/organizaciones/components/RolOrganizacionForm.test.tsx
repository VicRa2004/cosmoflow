// @vitest-environment happy-dom
import { cleanup, fireEvent, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderConQuery } from "@/test/renderConQuery";
import type { RolOrganizacionDto } from "../api/rolesOrganizacionApi";

const { mocksRolesApi, mocksToast } = vi.hoisted(() => ({
	mocksRolesApi: {
		catalogo: vi.fn(),
		crear: vi.fn(),
		actualizar: vi.fn(),
	},
	mocksToast: {
		success: vi.fn(),
		error: vi.fn(),
	},
}));

vi.mock("../api/rolesOrganizacionApi", () => ({
	rolesOrganizacionApi: mocksRolesApi,
}));
vi.mock("sonner", () => ({ toast: mocksToast }));

import { RolOrganizacionForm } from "./RolOrganizacionForm";

const catalogoEjemplo = {
	permisos: ["equipos:crear", "proyectos:crear", "tags:gestionar"] as const,
	plantillas: [
		{
			nombre: "Coordinación",
			permisos: ["equipos:crear", "proyectos:crear"] as const,
		},
	],
};

const rolInicial: RolOrganizacionDto = {
	id: 9,
	nombre: "Editor",
	permisos: ["proyectos:crear"],
	totalMiembros: 2,
};

describe("RolOrganizacionForm", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mocksRolesApi.catalogo.mockResolvedValue(catalogoEjemplo);
	});

	afterEach(() => cleanup());

	it("exige nombre obligatorio al crear sin llamar a la API", async () => {
		const onGuardado = vi.fn();
		renderConQuery(
			<RolOrganizacionForm organizacionId={4} onGuardado={onGuardado} />,
		);

		fireEvent.click(screen.getByRole("button", { name: "Crear rol" }));

		await waitFor(() => {
			expect(screen.getByText("Obligatorio")).toBeTruthy();
		});
		expect(mocksRolesApi.crear).not.toHaveBeenCalled();
		expect(onGuardado).not.toHaveBeenCalled();
	});

	it("rellena nombre y permisos desde una plantilla del catálogo y crea el rol", async () => {
		mocksRolesApi.crear.mockResolvedValue({
			id: 15,
			nombre: "Coordinación",
			permisos: ["equipos:crear", "proyectos:crear"],
			totalMiembros: 0,
		});
		const onGuardado = vi.fn();

		renderConQuery(
			<RolOrganizacionForm organizacionId={4} onGuardado={onGuardado} />,
		);

		const selectPlantilla = await screen.findByLabelText(
			"Partir de una plantilla (opcional)",
		);
		fireEvent.change(selectPlantilla, { target: { value: "Coordinación" } });

		const inputNombre = screen.getByLabelText("Nombre") as HTMLInputElement;
		expect(inputNombre.value).toBe("Coordinación");

		const checkEquipos = screen.getByLabelText(
			"Crear equipos",
		) as HTMLInputElement;
		const checkTags = screen.getByLabelText(
			"Gestionar los tags de la organización",
		) as HTMLInputElement;
		expect(checkEquipos.checked).toBe(true);
		expect(checkTags.checked).toBe(false);

		fireEvent.click(screen.getByRole("button", { name: "Crear rol" }));

		await waitFor(() => {
			expect(mocksRolesApi.crear).toHaveBeenCalledWith(4, {
				nombre: "Coordinación",
				permisos: ["equipos:crear", "proyectos:crear"],
			});
		});
		expect(onGuardado).toHaveBeenCalledTimes(1);
	});

	it("edita un rol existente ocultando las plantillas y permitiendo cambiar permisos", async () => {
		mocksRolesApi.actualizar.mockResolvedValue({
			...rolInicial,
			permisos: ["proyectos:crear", "tags:gestionar"],
		});
		const onGuardado = vi.fn();

		renderConQuery(
			<RolOrganizacionForm
				organizacionId={4}
				inicial={rolInicial}
				onGuardado={onGuardado}
			/>,
		);

		expect(
			screen.queryByLabelText("Partir de una plantilla (opcional)"),
		).toBeNull();

		const checkTags = await screen.findByLabelText(
			"Gestionar los tags de la organización",
		);
		fireEvent.click(checkTags);
		fireEvent.click(screen.getByRole("button", { name: "Guardar" }));

		await waitFor(() => {
			expect(mocksRolesApi.actualizar).toHaveBeenCalledWith(4, 9, {
				nombre: "Editor",
				permisos: ["proyectos:crear", "tags:gestionar"],
			});
		});
		expect(onGuardado).toHaveBeenCalledTimes(1);
	});
});
