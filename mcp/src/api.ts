export type Api = (
	metodo: "GET" | "POST" | "PUT",
	ruta: string,
	cuerpo?: unknown,
) => Promise<unknown>;

const ES_LOCAL = /^(localhost|127\.0\.0\.1|\[::1\])$/;

/** Cliente de la API REST. Lanza `Error` con un mensaje apto para mostrar a la IA. */
export function crearApi(url: string, token: string): Api {
	const base = new URL(url);
	// El token da acceso a toda la cuenta: nunca en claro por la red.
	if (base.protocol !== "https:" && !ES_LOCAL.test(base.hostname)) {
		throw new Error("COSMOFLOW_URL debe usar https (salvo en localhost)");
	}

	return async (metodo, ruta, cuerpo) => {
		const res = await fetch(new URL(ruta, base), {
			method: metodo,
			headers: {
				Authorization: `Bearer ${token}`,
				"Content-Type": "application/json",
			},
			body: cuerpo === undefined ? undefined : JSON.stringify(cuerpo),
			signal: AbortSignal.timeout(30_000),
		});
		if (res.status === 401) {
			throw new Error("El token de Cosmoflow es inválido o está revocado");
		}
		const texto = await res.text();
		if (res.ok) return texto ? JSON.parse(texto) : null;
		throw new Error(mensajeDeError(res.status, texto));
	};
}

function mensajeDeError(status: number, texto: string): string {
	try {
		const { error, details } = JSON.parse(texto);
		if (error) {
			return details ? `${error}: ${JSON.stringify(details)}` : String(error);
		}
	} catch {
		// Sin JSON (proxy, 502…): basta con el código.
	}
	return `La API respondió ${status}`;
}
