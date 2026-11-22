import { describe, expect, it } from "vitest";
import {
	deserializarParaEditor,
	detectarConsultaMencion,
	parsearMencionesTexto,
	serializarMenciones,
} from "./mencionesComentario";

describe("mencionesComentario", () => {
	it("parsea texto plano y menciones serializadas en orden", () => {
		expect(
			parsearMencionesTexto(
				"Hola [@Ana María](mencion:7), revisa esto con [@Luis](mencion:3).",
			),
		).toEqual([
			{ tipo: "texto", inicio: 0, valor: "Hola " },
			{ tipo: "mencion", inicio: 5, id: 7, nombre: "Ana María" },
			{ tipo: "texto", inicio: 28, valor: ", revisa esto con " },
			{ tipo: "mencion", inicio: 46, id: 3, nombre: "Luis" },
			{ tipo: "texto", inicio: 64, valor: "." },
		]);
	});

	it("deserializa a texto limpio y vuelve a serializar sin perder IDs", () => {
		const original = "Avísale a [@Ana María](mencion:7) y a [@Ana](mencion:2)!";
		const { texto, menciones } = deserializarParaEditor(original);

		expect(texto).toBe("Avísale a @Ana María y a @Ana!");
		expect(serializarMenciones(texto, menciones, [])).toBe(original);
	});

	it("serializa menciones de miembros aunque se escriban manualmente sin romper correos", () => {
		const miembros = [
			{ id: 10, nombre: "Victor" },
			{ id: 11, nombre: "Victor Raúl" },
		];
		const texto = "Hola @Victor Raúl, escribe a correo@Victor.com y @Victor.";
		expect(serializarMenciones(texto, new Map(), miembros)).toBe(
			"Hola [@Victor Raúl](mencion:11), escribe a correo@Victor.com y [@Victor](mencion:10).",
		);
	});

	it("detecta la consulta @ en la posición del cursor", () => {
		expect(detectarConsultaMencion("Hola @vic", 9)).toEqual({
			inicio: 5,
			consulta: "vic",
		});
		expect(detectarConsultaMencion("@", 1)).toEqual({
			inicio: 0,
			consulta: "",
		});
		expect(detectarConsultaMencion("correo@dominio.com", 18)).toBeNull();
		expect(detectarConsultaMencion("Hola mundo", 10)).toBeNull();
	});
});
