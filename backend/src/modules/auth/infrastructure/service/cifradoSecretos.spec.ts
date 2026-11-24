import { describe, expect, it } from "bun:test";
import { cifrar, descifrar } from "./cifradoSecretos";

describe("cifradoSecretos", () => {
	it("cifra con IV aleatorio y descifra el original", () => {
		const a = cifrar("JBSWY3DPEHPK3PXP");
		expect(a).not.toContain("JBSWY3DPEHPK3PXP");
		expect(cifrar("JBSWY3DPEHPK3PXP")).not.toBe(a);
		expect(descifrar(a)).toBe("JBSWY3DPEHPK3PXP");
	});

	it("rechaza un valor manipulado", () => {
		const [iv, tag, cifrado] = cifrar("JBSWY3DPEHPK3PXP").split(".");
		const alterado = `${cifrado?.[0] === "A" ? "B" : "A"}${cifrado?.slice(1)}`;
		expect(() => descifrar([iv, tag, alterado].join("."))).toThrow();
	});
});
