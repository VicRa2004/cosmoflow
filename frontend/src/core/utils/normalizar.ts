/** Para buscar sin distinguir mayúsculas ni acentos ("Raúl" ≈ "raul"). */
export const normalizar = (texto: string) =>
	texto.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();
