import { describe, expect, it } from "vitest";
import { clasificarAssets, detectarSistema } from "./plataformas";

const asset = (name: string) => ({
	name,
	browser_download_url: `https://x/${name}`,
	size: 1,
});

describe("clasificarAssets", () => {
	it("asocia cada archivo del Release a su sistema", () => {
		const descargas = clasificarAssets([
			asset("cosmoflow-0.8.0.apk"),
			asset("cosmoflow-0.8.0-windows-x64.zip"),
			asset("cosmoflow-0.8.0-windows-x64-setup.exe"),
			asset("Cosmoflow-0.8.0-macos-arm64.dmg"),
			asset("cosmoflow_0.8.0_amd64.deb"),
			asset("cosmoflow-0.8.0-linux-x86_64.tar.gz"),
		]);
		expect(descargas.map((d) => [d.sistema, d.etiqueta])).toEqual([
			["windows", "Instalador (.exe)"],
			["windows", "Portable (.zip)"],
			["macos", "Apple Silicon (.dmg)"],
			["linux", "Debian / Ubuntu (.deb)"],
			["linux", "Portable (.tar.gz)"],
			["android", "Android (.apk)"],
		]);
	});

	it("omite los sistemas sin archivo", () => {
		expect(clasificarAssets([asset("cosmoflow-0.7.1.apk")])).toHaveLength(1);
	});
});

describe("detectarSistema", () => {
	it("reconoce los sistemas habituales", () => {
		expect(detectarSistema("Mozilla/5.0 (Windows NT 10.0; Win64; x64)")).toBe(
			"windows",
		);
		expect(
			detectarSistema("Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0)"),
		).toBe("macos");
		expect(detectarSistema("Mozilla/5.0 (X11; Linux x86_64)")).toBe("linux");
		expect(detectarSistema("Mozilla/5.0 (Linux; Android 14; Pixel 8)")).toBe(
			"android",
		);
		expect(detectarSistema("curl/8.0")).toBeNull();
	});
});
