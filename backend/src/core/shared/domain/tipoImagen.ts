/** Tipo real de una imagen por sus primeros bytes: el `Content-Type` del cliente no es de fiar. */
export function detectarTipoImagen(
	datos: Uint8Array,
): { tipo: string; ext: string } | null {
	const empieza = (bytes: number[], desde = 0) =>
		bytes.every((b, i) => datos[desde + i] === b);
	if (empieza([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
		return { tipo: "image/png", ext: "png" };
	if (empieza([0xff, 0xd8, 0xff])) return { tipo: "image/jpeg", ext: "jpg" };
	if (empieza([0x52, 0x49, 0x46, 0x46]) && empieza([0x57, 0x45, 0x42, 0x50], 8))
		return { tipo: "image/webp", ext: "webp" };
	return null;
}
