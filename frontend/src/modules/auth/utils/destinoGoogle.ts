import { redirectSchema } from "../schemas/authSchemas";

const CLAVE = "destino-login-google";

export function guardarDestinoGoogle(destino?: string): void {
	try {
		if (destino) sessionStorage.setItem(CLAVE, destino);
		else sessionStorage.removeItem(CLAVE);
	} catch {
		// Sin almacenamiento, tras entrar se va a la portada.
	}
}

/** Lo borra al leerlo y solo devuelve rutas internas (mismo filtro que `?redirect=`). */
export function tomarDestinoGoogle(): string | undefined {
	try {
		const destino = sessionStorage.getItem(CLAVE);
		sessionStorage.removeItem(CLAVE);
		return redirectSchema.parse(destino ?? undefined);
	} catch {
		return undefined;
	}
}
