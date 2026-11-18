import { describe, expect, it } from "bun:test";
import { construirCorreoHtml, escaparHtml } from "./plantillaCorreo";

describe("plantillaCorreo", () => {
	it("escapa caracteres HTML en título, saludo, párrafos y nota", () => {
		const html = construirCorreoHtml({
			categoria: "Aviso <urgent>",
			titulo: 'Tarea "crítica" & más',
			saludo: "Hola, <script>alert(1)</script>:",
			parrafos: ["Revisa 'este' cambio & aprueba"],
			accion: {
				texto: "Ver > ahora",
				url: "https://app.cosmoflow.test/tareas/1?a=1&b=2",
			},
			nota: "Nota <privada>",
			appUrl: "https://app.cosmoflow.test",
		});

		expect(html).not.toContain("<script>");
		expect(html).toContain("&lt;script&gt;alert(1)&lt;/script&gt;");
		expect(html).toContain("Tarea &quot;crítica&quot; &amp; más");
		expect(html).toContain("Revisa &#39;este&#39; cambio &amp; aprueba");
		expect(html).toContain(
			'href="https://app.cosmoflow.test/tareas/1?a=1&amp;b=2"',
		);
		expect(html).toContain("Ver &gt; ahora");
		expect(html).toContain("Nota &lt;privada&gt;");
	});

	it("rechaza URLs no http(s) en el botón de acción", () => {
		const html = construirCorreoHtml({
			categoria: "Cuenta",
			titulo: "Prueba",
			saludo: "Hola:",
			parrafos: ["Texto"],
			accion: {
				texto: "Abrir",
				url: "javascript:alert(1)",
			},
		});

		expect(html).not.toContain("javascript:");
		expect(html).toContain('href="#"');
	});

	it("escaparHtml devuelve cadena segura", () => {
		expect(escaparHtml(`a&b<c>d"e'f`)).toBe("a&amp;b&lt;c&gt;d&quot;e&#39;f");
	});
});
