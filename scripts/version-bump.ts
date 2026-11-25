/**
 * Sube la versión única del monorepo en los archivos que la guardan.
 * Uso: `pnpm version:bump 0.6.0` desde la raíz. Luego: commit y `git tag v0.6.0`.
 */
import { readFileSync, writeFileSync } from "node:fs";

const version = process.argv[2];
if (!version || !/^\d+\.\d+\.\d+$/.test(version)) {
	console.error("Uso: pnpm version:bump X.Y.Z");
	process.exit(1);
}

// El build number del APK lo pone el CI (`--build-number`); aquí siempre `+1`.
const archivos: [string, RegExp, string][] = [
	["package.json", /"version": "[^"]+"/, `"version": "${version}"`],
	["backend/package.json", /"version": "[^"]+"/, `"version": "${version}"`],
	["frontend/package.json", /"version": "[^"]+"/, `"version": "${version}"`],
	["mobile/pubspec.yaml", /^version: .+$/m, `version: ${version}+1`],
	["desktop/Cargo.toml", /^version = "[^"]+"/m, `version = "${version}"`],
];

for (const [ruta, patron, reemplazo] of archivos) {
	const texto = readFileSync(ruta, "utf8");
	if (!patron.test(texto)) throw new Error(`Sin versión en ${ruta}`);
	writeFileSync(ruta, texto.replace(patron, reemplazo));
	console.log(`${ruta} → ${version}`);
}
console.log(
	`\nSiguiente: git commit -am "chore: versión ${version}" && git tag v${version} && git push && git push --tags`,
);
