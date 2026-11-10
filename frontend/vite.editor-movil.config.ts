import path from "node:path";
import { defineConfig } from "vite";

// Editor de la app móvil (`src/modules/adjuntos/editor/movil.ts`): un IIFE y su CSS
// que Flutter mete en el HTML del WebView. `pnpm build:editor-movil` y commitear el resultado.
export default defineConfig({
	publicDir: false,
	build: {
		lib: {
			entry: path.resolve(
				import.meta.dirname,
				"src/modules/adjuntos/editor/movil.ts",
			),
			formats: ["iife"],
			name: "EditorMovil",
			fileName: () => "editor.js",
			cssFileName: "editor",
		},
		outDir: path.resolve(import.meta.dirname, "../mobile/assets/editor"),
		// `index.html` es fijo y vive ahí; solo se reescriben editor.js y editor.css.
		emptyOutDir: false,
		target: "es2022",
	},
	define: { "process.env.NODE_ENV": JSON.stringify("production") },
});
