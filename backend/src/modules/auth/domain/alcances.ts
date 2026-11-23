/**
 * Lo que puede hacer un token personal o una conexión (MCP) con permisos limitados.
 * Se suman a los permisos del usuario: nunca dan más de lo que él puede.
 */
export const ALCANCES = [
	"tareas:leer",
	"tareas:escribir",
	"notas:leer",
	"notas:escribir",
	"notificaciones:leer",
	"notificaciones:escribir",
	"organizaciones:leer",
	"organizaciones:escribir",
] as const;

export type Alcance = (typeof ALCANCES)[number];

/** El orden importa: las subrutas de organización van antes que la genérica. */
const AREAS: [RegExp, string][] = [
	[/^\/api\/organizaciones\/\d+\/(plantillas|tags)(\/|$)/, "tareas"],
	[/^\/api\/organizaciones\/\d+\/notificaciones(\/|$)/, "notificaciones"],
	[/^\/api\/(tareas|plantillas|tags|calendario)(\/|$)/, "tareas"],
	[/^\/api\/(notas|carpetas)(\/|$)/, "notas"],
	[/^\/api\/notificaciones(\/|$)/, "notificaciones"],
	[/^\/api\/(organizaciones|invitaciones)(\/|$)/, "organizaciones"],
];

/**
 * ¿Permiten `alcances` esta petición? Escribir incluye leer. Fuera de `/api` (el propio
 * `/mcp`) no se limita; dentro, lo que no encaja en ningún área se deniega.
 */
export function permiteAlcance(
	alcances: readonly string[],
	metodo: string,
	ruta: string,
): boolean {
	if (!ruta.startsWith("/api/")) return true;
	const area = AREAS.find(([patron]) => patron.test(ruta))?.[1];
	if (!area) return false;
	return (
		alcances.includes(`${area}:escribir`) ||
		(metodo === "GET" && alcances.includes(`${area}:leer`))
	);
}
