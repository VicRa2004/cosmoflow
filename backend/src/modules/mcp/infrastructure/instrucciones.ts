/** Lo que el asistente debe saber de Cosmoflow antes de usar las herramientas. */
const BASE = `Cosmoflow gestiona tareas, notas, proyectos y equipos.
- Una tarea o nota es personal salvo que se indique un destino: organizacionId, equipoId o proyectoId (solo uno). Saca los ids con listar_organizaciones, listar_equipos y listar_proyectos; no los inventes.
- Responsables y menciones usan ids de listar_miembros. Las fechas van como AAAA-MM-DD.
- Para cambiar una subtarea usa marcar_subtarea; si editas la checklist entera, manda cada subtarea existente con su id o se creará de nuevo.
- Las respuestas son JSON de la API; un error explica qué corregir.
- Borrar manda a la papelera (se puede restaurar); mover_tarea no tiene vuelta atrás: confírmalo con el usuario antes.`;

/** Añadidos para clientes con limitaciones propias, por su `clientInfo.name`. */
const POR_CLIENTE: [RegExp, string][] = [
	[
		/chatgpt|openai/i,
		"- Si una herramienta de escritura no está disponible, puede que el plan de ChatGPT del usuario solo permita lectura: díselo en lugar de reintentar.",
	],
];

export function instrucciones(cliente?: string): string {
	const extra = POR_CLIENTE.filter(
		([patron]) => cliente && patron.test(cliente),
	).map(([, texto]) => texto);
	return [BASE, ...extra].join("\n");
}
