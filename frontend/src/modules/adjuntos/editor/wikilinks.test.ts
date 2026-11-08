import { describe, expect, it } from "vitest";
import {
	convertirWikilinks,
	fueraDeCodigo,
	restaurarWikilinks,
	tituloDeWikilink,
} from "./wikilinks";

const idaYVuelta = (markdown: string) =>
	restaurarWikilinks(fueraDeCodigo(markdown, convertirWikilinks));

describe("wikilinks en el editor", () => {
	it.each([
		"[[Plan]]",
		"[[Plan (Q1)]] y [[Plan|el plan]]",
		"[[Plan#Fase 1]] y [[Plan#Fase 1|la fase]]",
		"![[foto.png]]",
		"`[[código]]`",
	])("%s sobrevive a abrir y guardar", (markdown) => {
		expect(idaYVuelta(markdown)).toBe(markdown);
	});

	it("repara los wikilinks guardados con escape y los embebidos escapados", () => {
		expect(restaurarWikilinks("\\[\\[Plan]] !\\[\\[foto.png]]")).toBe(
			"[[Plan]] ![[foto.png]]",
		);
		expect(convertirWikilinks("\\[\\[Plan]]")).toBe("[Plan](wikilink:Plan)");
	});

	it("quita los escapes del texto del enlace", () => {
		expect(restaurarWikilinks("[mi\\_nota](wikilink:mi_nota)")).toBe(
			"[[mi_nota]]",
		);
	});

	it("el título no incluye la sección y un href roto no lanza", () => {
		expect(tituloDeWikilink("wikilink:Plan%23Fase")).toBe("Plan");
		expect(tituloDeWikilink("wikilink:%")).toBe("%");
	});
});
