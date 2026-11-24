import { describe, expect, it } from "bun:test";
import {
	base32Codificar,
	base32Decodificar,
	codigoTotp,
	generarCodigosRecuperacion,
	generarSecretoTotp,
	hashearCodigoRecuperacion,
	pasoActual,
	uriOtpauth,
	verificarTotp,
} from "./totp";

// RFC 6238, apéndice B: semillas ASCII y códigos de 8 dígitos.
const SEMILLAS = {
	sha1: Buffer.from("12345678901234567890"),
	sha256: Buffer.from("12345678901234567890123456789012"),
	sha512: Buffer.from(
		"1234567890123456789012345678901234567890123456789012345678901234",
	),
} as const;

const VECTORES: [number, string, keyof typeof SEMILLAS][] = [
	[59, "94287082", "sha1"],
	[59, "46119246", "sha256"],
	[59, "90693936", "sha512"],
	[1111111109, "07081804", "sha1"],
	[1111111109, "68084774", "sha256"],
	[1111111109, "25091201", "sha512"],
	[1111111111, "14050471", "sha1"],
	[1111111111, "67062674", "sha256"],
	[1111111111, "99943326", "sha512"],
	[1234567890, "89005924", "sha1"],
	[1234567890, "91819424", "sha256"],
	[1234567890, "93441116", "sha512"],
	[2000000000, "69279037", "sha1"],
	[2000000000, "90698825", "sha256"],
	[2000000000, "38618901", "sha512"],
	[20000000000, "65353130", "sha1"],
	[20000000000, "77737706", "sha256"],
	[20000000000, "47863826", "sha512"],
];

describe("TOTP (RFC 6238)", () => {
	it.each(VECTORES)("T=%d → %s (%s)", (segundos, esperado, algoritmo) => {
		const paso = pasoActual(segundos * 1000);
		expect(codigoTotp(SEMILLAS[algoritmo], paso, 8, algoritmo)).toBe(esperado);
	});

	it("base32 ida y vuelta (RFC 4648)", () => {
		expect(base32Codificar(Buffer.from("foobar"))).toBe("MZXW6YTBOI");
		expect(base32Decodificar("MZXW6YTBOI").toString()).toBe("foobar");
		const secreto = generarSecretoTotp();
		expect(secreto).toMatch(/^[A-Z2-7]{32}$/);
		expect(base32Codificar(base32Decodificar(secreto))).toBe(secreto);
	});

	it("acepta el código del paso actual y de los vecinos, y devuelve su paso", () => {
		const secreto = base32Codificar(SEMILLAS.sha1);
		const ahora = 1111111111 * 1000;
		const paso = pasoActual(ahora);
		const codigoDe = (p: number) => codigoTotp(SEMILLAS.sha1, p);

		expect(verificarTotp(secreto, codigoDe(paso), ahora)).toBe(paso);
		expect(verificarTotp(secreto, codigoDe(paso - 1), ahora)).toBe(paso - 1);
		expect(verificarTotp(secreto, codigoDe(paso + 1), ahora)).toBe(paso + 1);
		expect(verificarTotp(secreto, codigoDe(paso - 2), ahora)).toBeNull();
		expect(verificarTotp(secreto, "12345", ahora)).toBeNull();
		expect(verificarTotp(secreto, "abcdef", ahora)).toBeNull();
	});

	it("la URI otpauth lleva emisor, cuenta y secreto", () => {
		const uri = uriOtpauth("Cosmoflow", "ana@x.com", "ABC");
		expect(uri).toStartWith("otpauth://totp/Cosmoflow%3Aana%40x.com?");
		expect(uri).toContain("secret=ABC");
		expect(uri).toContain("issuer=Cosmoflow");
	});

	it("códigos de recuperación únicos y su hash ignora guion y mayúsculas", () => {
		const codigos = generarCodigosRecuperacion();
		expect(codigos).toHaveLength(10);
		expect(new Set(codigos).size).toBe(10);
		for (const codigo of codigos)
			expect(codigo).toMatch(/^[a-z2-7]{5}-[a-z2-7]{5}$/);

		const [codigo] = codigos as [string];
		expect(
			hashearCodigoRecuperacion(codigo.toUpperCase().replace("-", "")),
		).toBe(hashearCodigoRecuperacion(codigo));
	});
});
