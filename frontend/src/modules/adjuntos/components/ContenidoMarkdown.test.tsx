import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ContenidoMarkdown } from "./ContenidoMarkdown";

const html = (markdown: string) =>
	renderToStaticMarkup(<ContenidoMarkdown>{markdown}</ContenidoMarkdown>);

describe("ContenidoMarkdown", () => {
	it("carga las imágenes de /api/adjuntos con el cliente, no con un <img src> directo", () => {
		const salida = html("![lisboa](/api/adjuntos/2)");

		expect(salida).not.toContain('src="/api/adjuntos/2"');
		expect(salida).toContain("animate-pulse");
	});

	it("deja tal cual las imágenes externas", () => {
		expect(html("![x](https://ejemplo.com/a.png)")).toContain(
			'<img src="https://ejemplo.com/a.png" alt="x"/>',
		);
	});

	it("no interpreta HTML ni enlaces javascript:", () => {
		const salida = html("<script>alert(1)</script> [mal](javascript:alert(1))");

		expect(salida).not.toContain("<script>");
		expect(salida).not.toContain("javascript:");
	});

	it("abre los enlaces externos en otra pestaña sin opener", () => {
		expect(html("[web](https://ejemplo.com)")).toContain(
			'target="_blank" rel="noopener noreferrer"',
		);
	});
});
