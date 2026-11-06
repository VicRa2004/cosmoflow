export const ESCALAS = ["pequeno", "normal", "grande"] as const;
/** Solo fuentes que ya trae la app (Inter) o el sistema: nada que descargar. */
export const FUENTES_MARKDOWN = ["inter", "sistema", "serif", "mono"] as const;
export const INTERLINEADOS = ["compacto", "normal", "amplio"] as const;
export const COLORES_MARKDOWN = ["suave", "intenso"] as const;

export interface PreferenciasInterfaz {
	/** Tamaño de toda la interfaz. */
	tamanoInterfaz: (typeof ESCALAS)[number];
	markdownFuente: (typeof FUENTES_MARKDOWN)[number];
	markdownTamano: (typeof ESCALAS)[number];
	markdownInterlineado: (typeof INTERLINEADOS)[number];
	markdownColor: (typeof COLORES_MARKDOWN)[number];
	/** «Nueva» en Pendientes ofrece también notas. */
	pendientesNotas: boolean;
	/** Organizaciones en «Nueva» de Pendientes; `null` = 20 sin notas, 10 con notas. */
	pendientesOrganizaciones: number | null;
}

export const PREFERENCIAS_PREDETERMINADAS: PreferenciasInterfaz = {
	tamanoInterfaz: "normal",
	markdownFuente: "inter",
	markdownTamano: "normal",
	markdownInterlineado: "normal",
	markdownColor: "suave",
	pendientesNotas: false,
	pendientesOrganizaciones: null,
};
