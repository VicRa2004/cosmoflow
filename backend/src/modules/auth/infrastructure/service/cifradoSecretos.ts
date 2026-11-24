import {
	createCipheriv,
	createDecipheriv,
	createHash,
	randomBytes,
} from "node:crypto";
import { env } from "@/core/config/env";

/** Clave AES-256 propia o derivada de JWT_SECRET (con etiqueta, para no reutilizar la misma clave). */
const CLAVE = createHash("sha256")
	.update(env.DOS_PASOS_CLAVE ?? `cosmoflow:dos-pasos:${env.JWT_SECRET}`)
	.digest();

/** AES-256-GCM: `iv.tag.cifrado` en base64url. GCM detecta cualquier manipulación al descifrar. */
export function cifrar(texto: string): string {
	const iv = randomBytes(12);
	const cifrador = createCipheriv("aes-256-gcm", CLAVE, iv);
	const cifrado = Buffer.concat([
		cifrador.update(texto, "utf8"),
		cifrador.final(),
	]);
	return [iv, cifrador.getAuthTag(), cifrado]
		.map((parte) => parte.toString("base64url"))
		.join(".");
}

export function descifrar(valor: string): string {
	const [iv, tag, cifrado] = valor
		.split(".")
		.map((parte) => Buffer.from(parte, "base64url"));
	if (!iv || !tag || !cifrado)
		throw new Error("Secreto cifrado con formato inválido");
	const descifrador = createDecipheriv("aes-256-gcm", CLAVE, iv);
	descifrador.setAuthTag(tag);
	return Buffer.concat([
		descifrador.update(cifrado),
		descifrador.final(),
	]).toString("utf8");
}
