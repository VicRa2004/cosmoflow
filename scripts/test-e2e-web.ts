import { existsSync, readFileSync } from "node:fs";
import net from "node:net";
import path from "node:path";

const RAIZ = path.resolve(import.meta.dirname, "..");
const BACKEND_DIR = path.join(RAIZ, "backend");
const FRONTEND_DIR = path.join(RAIZ, "frontend");

/** Carga `backend/.env` solo para variables ausentes (en CI ya vienen en `process.env`). */
function cargarEnvBackend(): void {
	const rutaEnv = path.join(BACKEND_DIR, ".env");
	if (!existsSync(rutaEnv)) return;
	for (const linea of readFileSync(rutaEnv, "utf8").split(/\r?\n/)) {
		const limpia = linea.trim();
		if (!limpia || limpia.startsWith("#")) continue;
		const sep = limpia.indexOf("=");
		if (sep === -1) continue;
		const clave = limpia.slice(0, sep).trim();
		let valor = limpia.slice(sep + 1).trim();
		if (
			(valor.startsWith('"') && valor.endsWith('"')) ||
			(valor.startsWith("'") && valor.endsWith("'"))
		) {
			valor = valor.slice(1, -1);
		}
		if (process.env[clave] === undefined) {
			process.env[clave] = valor;
		}
	}
}

function puertoLibre(): Promise<number> {
	return new Promise((resolve, reject) => {
		const srv = net.createServer();
		srv.unref();
		srv.on("error", reject);
		srv.listen(0, "127.0.0.1", () => {
			const addr = srv.address();
			if (!addr || typeof addr === "string") {
				srv.close();
				reject(new Error("No se pudo reservar un puerto libre"));
				return;
			}
			const { port } = addr;
			srv.close(() => resolve(port));
		});
	});
}

async function esperarHttp(
	url: string,
	nombre: string,
	timeoutMs = 30_000,
): Promise<void> {
	const limite = Date.now() + timeoutMs;
	let ultimoError = "";
	while (Date.now() < limite) {
		try {
			const res = await fetch(url);
			if (res.ok) return;
			ultimoError = `HTTP ${res.status}`;
		} catch (err) {
			ultimoError = err instanceof Error ? err.message : String(err);
		}
		await Bun.sleep(250);
	}
	throw new Error(
		`Tiempo agotado esperando a ${nombre} (${url}): ${ultimoError}`,
	);
}

function ejecutarSync(
	cmd: string[],
	cwd: string,
	env: Record<string, string | undefined>,
): void {
	const { exitCode } = Bun.spawnSync(cmd, {
		cwd,
		env,
		stdio: ["inherit", "inherit", "inherit"],
	});
	if (exitCode !== 0) process.exit(exitCode);
}

async function main() {
	cargarEnvBackend();

	const dbUrl = process.env.DATABASE_URL_TEST || process.env.DATABASE_URL;
	if (!dbUrl) {
		console.error(
			"❌ Define DATABASE_URL_TEST o DATABASE_URL antes de lanzar test:e2e:web.",
		);
		process.exit(1);
	}

	const envBackend: Record<string, string | undefined> = {
		...process.env,
		DATABASE_URL: dbUrl,
		NODE_ENV: "test",
	};

	const prismaBin = path.join(
		BACKEND_DIR,
		"node_modules/prisma/build/index.js",
	);
	ejecutarSync(
		["bun", prismaBin, "migrate", "deploy"],
		BACKEND_DIR,
		envBackend,
	);
	ejecutarSync(["bun", "prisma/seed-demo.ts"], BACKEND_DIR, envBackend);

	const puertoBackend = await puertoLibre();
	const puertoFrontend = await puertoLibre();
	const urlBackend = `http://localhost:${puertoBackend}`;
	const urlFrontend = `http://localhost:${puertoFrontend}`;

	const backend = Bun.spawn(["bun", "src/index.ts"], {
		cwd: BACKEND_DIR,
		env: {
			...envBackend,
			PORT: String(puertoBackend),
			CORS_ORIGIN: urlFrontend,
			APP_URL: urlFrontend,
		},
		stdout: "inherit",
		stderr: "inherit",
	});

	const frontend = Bun.spawn(
		["pnpm", "exec", "vite", "--port", String(puertoFrontend), "--strictPort"],
		{
			cwd: FRONTEND_DIR,
			env: {
				...process.env,
				VITE_API_URL: urlBackend,
			},
			stdout: "inherit",
			stderr: "inherit",
		},
	);

	try {
		await Promise.all([
			esperarHttp(`${urlBackend}/health`, "backend"),
			esperarHttp(`${urlFrontend}/login`, "frontend"),
		]);

		const playwright = Bun.spawn(["pnpm", "exec", "playwright", "test"], {
			cwd: FRONTEND_DIR,
			env: {
				...process.env,
				PLAYWRIGHT_BASE_URL: urlFrontend,
			},
			stdio: ["inherit", "inherit", "inherit"],
		});

		const codigo = await playwright.exited;
		process.exitCode = codigo;
	} finally {
		frontend.kill();
		backend.kill();
		await Promise.allSettled([frontend.exited, backend.exited]);
	}
}

await main();
