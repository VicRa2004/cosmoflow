import {
	createHash,
	createHmac,
	randomBytes,
	timingSafeEqual,
} from "node:crypto";

/** TOTP (RFC 6238) sobre HOTP (RFC 4226): SHA-1, 6 dígitos y pasos de 30 s, lo que esperan todas las apps autenticadoras. */
const PASO_SEGUNDOS = 30;
const DIGITOS = 6;
/** Pasos de tolerancia a cada lado por desfase de reloj (±30 s). */
const VENTANA = 1;

const ALFABETO_BASE32 = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

export function base32Codificar(bytes: Uint8Array): string {
	let bits = 0;
	let valor = 0;
	let salida = "";
	for (const byte of bytes) {
		valor = (valor << 8) | byte;
		bits += 8;
		while (bits >= 5) {
			salida += ALFABETO_BASE32[(valor >>> (bits - 5)) & 31];
			bits -= 5;
		}
	}
	if (bits > 0) salida += ALFABETO_BASE32[(valor << (5 - bits)) & 31];
	return salida;
}

export function base32Decodificar(texto: string): Buffer {
	const limpio = texto.toUpperCase().replace(/=+$|\s/g, "");
	let bits = 0;
	let valor = 0;
	const bytes: number[] = [];
	for (const caracter of limpio) {
		const indice = ALFABETO_BASE32.indexOf(caracter);
		if (indice === -1) throw new Error("Secreto base32 inválido");
		valor = (valor << 5) | indice;
		bits += 5;
		if (bits >= 8) {
			bytes.push((valor >>> (bits - 8)) & 255);
			bits -= 8;
		}
	}
	return Buffer.from(bytes);
}

/** Código HOTP del contador `paso`; `algoritmo` y `digitos` solo cambian en los vectores del RFC. */
export function codigoTotp(
	secreto: Buffer,
	paso: number,
	digitos = DIGITOS,
	algoritmo: "sha1" | "sha256" | "sha512" = "sha1",
): string {
	const contador = Buffer.alloc(8);
	contador.writeBigUInt64BE(BigInt(paso));
	const hmac = createHmac(algoritmo, secreto).update(contador).digest();
	const desplazamiento = (hmac[hmac.length - 1] as number) & 0xf;
	const binario = hmac.readUInt32BE(desplazamiento) & 0x7fffffff;
	return String(binario % 10 ** digitos).padStart(digitos, "0");
}

export const pasoActual = (ahoraMs: number): number =>
	Math.floor(ahoraMs / 1000 / PASO_SEGUNDOS);

/** @returns el paso al que corresponde `codigo` dentro de la ventana, o `null` si no vale. */
export function verificarTotp(
	secretoBase32: string,
	codigo: string,
	ahoraMs: number,
): number | null {
	if (!/^\d{6}$/.test(codigo)) return null;
	const secreto = base32Decodificar(secretoBase32);
	const actual = pasoActual(ahoraMs);
	for (let paso = actual - VENTANA; paso <= actual + VENTANA; paso++) {
		const esperado = Buffer.from(codigoTotp(secreto, paso));
		if (timingSafeEqual(esperado, Buffer.from(codigo))) return paso;
	}
	return null;
}

/** 160 bits aleatorios en base32 (lo que recomienda el RFC 4226 para SHA-1). */
export const generarSecretoTotp = (): string =>
	base32Codificar(randomBytes(20));

/** URI `otpauth://` que la app autenticadora lee del QR. */
export function uriOtpauth(
	emisor: string,
	cuenta: string,
	secreto: string,
): string {
	const etiqueta = encodeURIComponent(`${emisor}:${cuenta}`);
	const parametros = new URLSearchParams({
		secret: secreto,
		issuer: emisor,
		algorithm: "SHA1",
		digits: String(DIGITOS),
		period: String(PASO_SEGUNDOS),
	});
	return `otpauth://totp/${etiqueta}?${parametros}`;
}

// ── Códigos de recuperación ────────────────────────────────────────────────

const CANTIDAD_CODIGOS_RECUPERACION = 10;

/** Diez códigos `xxxxx-xxxxx` (50 bits cada uno): se muestran una sola vez. */
export const generarCodigosRecuperacion = (): string[] =>
	Array.from({ length: CANTIDAD_CODIGOS_RECUPERACION }, () => {
		const texto = base32Codificar(randomBytes(7)).slice(0, 10).toLowerCase();
		return `${texto.slice(0, 5)}-${texto.slice(5)}`;
	});

/** Hash del código normalizado (sin guion ni mayúsculas): así se guarda y se busca. */
export const hashearCodigoRecuperacion = (codigo: string): string =>
	createHash("sha256")
		.update(codigo.toLowerCase().replace(/[^a-z0-9]/g, ""))
		.digest("hex");
