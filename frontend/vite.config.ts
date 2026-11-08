import { readFileSync } from "node:fs";
import path from "node:path";
import tailwindcss from "@tailwindcss/vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// https://vite.dev/config/
// Versión única del monorepo: la del package.json raíz (la que marca el tag vX.Y.Z).
const { version } = JSON.parse(
	readFileSync(path.resolve(import.meta.dirname, "../package.json"), "utf8"),
);

export default defineConfig({
	define: {
		"import.meta.env.VITE_APP_VERSION": JSON.stringify(version),
	},
	plugins: [
		tanstackRouter({
			target: "react",
			autoCodeSplitting: true,
		}),
		react(),
		tailwindcss(),
	],
	resolve: {
		alias: {
			"@": path.resolve(import.meta.dirname, "./src"),
		},
	},
	server: {
		port: 5173,
		proxy: {
			"/api": {
				target: process.env.VITE_API_URL || "http://localhost:3000",
				changeOrigin: true,
			},
			// Conector MCP: `/mcp` y su descubrimiento OAuth van en la raíz del dominio.
			"/mcp": process.env.VITE_API_URL || "http://localhost:3000",
			"/.well-known": process.env.VITE_API_URL || "http://localhost:3000",
		},
	},
});
