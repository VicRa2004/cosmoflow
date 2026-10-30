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

	it("convierte los <br /> de Crepe en saltos, salvo dentro de código", () => {
		const salida = html("a\n\n<br />\n\nb<br />c `x<br>y`");

		expect(salida).toContain("<p>\u200b</p>");
		expect(salida).toContain("b<br/>c <code>x&lt;br&gt;y</code>");
		expect(html("```\n<br />\n```")).toContain("&lt;br /&gt;");
	});

	it("muestra las menciones como chip y sigue quitando los protocolos peligrosos", () => {
		const salida = html("[@Ana](mencion:12) [mal](javascript:alert(1))");

		expect(salida).toContain('<span class="mencion">@Ana</span>');
		expect(salida).not.toContain("javascript:");
	});

	it("abre los enlaces externos en otra pestaña sin opener", () => {
		expect(html("[web](https://ejemplo.com)")).toContain(
			'target="_blank" rel="noopener noreferrer"',
		);
	});
});
