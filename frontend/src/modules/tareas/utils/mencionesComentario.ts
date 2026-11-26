/** Persona mencionable en un comentario de tarea compartida. */
export interface MencionableComentario {
	id: number;
	nombre: string;
	email?: string;
}

const REGEX_MENCION_SERIALIZADA = /\[@([^\]]+)\]\(mencion:(\d+)\)/g;

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
