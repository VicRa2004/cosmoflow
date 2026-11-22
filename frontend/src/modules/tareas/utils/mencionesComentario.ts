/** Persona mencionable en un comentario de tarea compartida. */
export interface MencionableComentario {
	id: number;
	nombre: string;
	email?: string;
}

export type SegmentoComentario =
	| { tipo: "texto"; inicio: number; valor: string }
	| { tipo: "mencion"; inicio: number; id: number; nombre: string };

const REGEX_MENCION_SERIALIZADA = /\[@([^\]]+)\]\(mencion:(\d+)\)/g;

/** Divide un comentario guardado en trozos de texto plano y menciones `[@Nombre](mencion:ID)`. */
export function parsearMencionesTexto(contenido: string): SegmentoComentario[] {
	const segmentos: SegmentoComentario[] = [];
	let ultimoIndice = 0;

	for (const match of contenido.matchAll(REGEX_MENCION_SERIALIZADA)) {
		const indice = match.index ?? 0;
		if (indice > ultimoIndice) {
			segmentos.push({
				tipo: "texto",
				inicio: ultimoIndice,
				valor: contenido.slice(ultimoIndice, indice),
			});
		}
		segmentos.push({
			tipo: "mencion",
			inicio: indice,
			nombre: match[1] ?? "",
			id: Number(match[2]),
		});
		ultimoIndice = indice + match[0].length;
	}

	if (ultimoIndice < contenido.length) {
		segmentos.push({
			tipo: "texto",
			inicio: ultimoIndice,
			valor: contenido.slice(ultimoIndice),
		});
	}

	return segmentos;
}

/**
 * Convierte el formato persistido (`[@Ana](mencion:5)`) a texto limpio (`@Ana`)
 * para editar sin exponer sintaxis de enlace, conservando el mapa de IDs.
 */
export function deserializarParaEditor(contenido: string): {
	texto: string;
	menciones: Map<string, number>;
} {
	const menciones = new Map<string, number>();
	const texto = contenido.replace(
		REGEX_MENCION_SERIALIZADA,
		(_todo, nombre: string, id: string) => {
			menciones.set(nombre, Number(id));
			return `@${nombre}`;
		},
	);
	return { texto, menciones };
}

const escaparRegex = (valor: string) =>
	valor.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * Convierte `@Nombre` del editor clásico en `[@Nombre](mencion:ID)` para que
 * el backend extraiga menciones y envíe notificaciones.
 */
export function serializarMenciones(
	texto: string,
	mencionesSeleccionadas: ReadonlyMap<string, number>,
	miembros: readonly MencionableComentario[],
): string {
	const mapa = new Map<string, number>();
	for (const miembro of miembros) {
		mapa.set(miembro.nombre, miembro.id);
	}
	for (const [nombre, id] of mencionesSeleccionadas) {
		mapa.set(nombre, id);
	}

	if (mapa.size === 0) return texto;

	// Ordenar del nombre más largo al más corto evita que `@Ana` capture `@Ana María`.
	const nombres = [...mapa.keys()]
		.filter((n) => n.length > 0)
		.sort((a, b) => b.length - a.length);
	if (nombres.length === 0) return texto;

	const alternancia = nombres.map(escaparRegex).join("|");
	// Solo coincide si `@` va al inicio o tras espacio/puntuación de apertura,
	// y termina en fin de texto, espacio o signo de puntuación.
	const regex = new RegExp(
		`(^|[\\s([{"'¿¡])@(${alternancia})(?=$|[\\s.,;:!?\\])}"'])`,
		"g",
	);

	return texto.replace(regex, (_todo, prefijo: string, nombre: string) => {
		const id = mapa.get(nombre);
		return id !== undefined ? `${prefijo}[@${nombre}](mencion:${id})` : _todo;
	});
}

/**
 * Detecta si el cursor está escribiendo una mención `@consulta` para abrir
 * el menú flotante de miembros.
 */
export function detectarConsultaMencion(
	texto: string,
	cursor: number,
): { inicio: number; consulta: string } | null {
	const antes = texto.slice(0, cursor);
	const match = /(?:^|[\s([{"'¿¡])@([^\n@]{0,40})$/.exec(antes);
	if (!match) return null;
	const consulta = match[1] ?? "";
	const inicio = cursor - consulta.length - 1;
	return { inicio, consulta };
}
