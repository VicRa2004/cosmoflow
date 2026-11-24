import { describe, expect, it } from "vitest";
import type { PlantillaTareaDto } from "../api/plantillasApi";
import {
	editarPlantillaFormSchema,
	plantillaAEdicion,
} from "./plantillaSchemas";

const plantilla: PlantillaTareaDto = {
	id: 1,
	nombre: "Release",
	titulo: "Publicar versión",
	contenido: "## Pasos",
	prioridad: "alta",
	color: null,
	subtareas: ["Changelog", "Tag"],
};

describe("editarPlantillaFormSchema", () => {
	it("ida y vuelta: sin cambios da el mismo cuerpo", () => {
		const { id: _, ...cuerpo } = plantilla;
		expect(
			editarPlantillaFormSchema.parse(plantillaAEdicion(plantilla)),
		).toEqual(cuerpo);
	});

	it("recorta y descarta subtareas vacías; color vacío es null", () => {
		const valores = {
			...plantillaAEdicion({ ...plantilla, color: "#ff0000" }),
			color: "",
			subtareas: [
				{ titulo: "  Changelog ", completada: true },
				{ titulo: "   ", completada: false },
			],
		};
		const resultado = editarPlantillaFormSchema.parse(valores);
		expect(resultado.subtareas).toEqual(["Changelog"]);
		expect(resultado.color).toBeNull();
	});

	it("exige nombre y título", () => {
		const r = editarPlantillaFormSchema.safeParse({
			...plantillaAEdicion(plantilla),
			nombre: " ",
			titulo: "",
		});
		expect(r.success).toBe(false);
	});
});
