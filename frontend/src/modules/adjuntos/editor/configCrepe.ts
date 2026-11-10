import type { CrepeConfig } from "@milkdown/crepe";

// Solo tipos: el editor de la app (`movil.ts`) importa las features una a una.
type Configs = NonNullable<CrepeConfig["featureConfigs"]>;

/** Textos en español de Crepe, compartidos por la web y el editor de la app. */
export const PLACEHOLDER_EDITOR =
	"Escribe o pulsa «/» para insertar un bloque…";

export const etiquetasBloques: Configs["block-edit"] = {
	textGroup: {
		label: "Texto",
		text: { label: "Texto" },
		h1: { label: "Título 1" },
		h2: { label: "Título 2" },
		h3: { label: "Título 3" },
		h4: { label: "Título 4" },
		h5: { label: "Título 5" },
		h6: { label: "Título 6" },
		quote: { label: "Cita" },
		divider: { label: "Separador" },
	},
	listGroup: {
		label: "Listas",
		bulletList: { label: "Lista" },
		orderedList: { label: "Lista numerada" },
		taskList: { label: "Lista de tareas" },
	},
	advancedGroup: {
		label: "Avanzado",
		image: { label: "Imagen" },
		codeBlock: { label: "Código" },
		table: { label: "Tabla" },
	},
};

export const etiquetasToolbar: Configs["toolbar"] = {
	boldLabel: "Negrita",
	italicLabel: "Cursiva",
	strikethroughLabel: "Tachado",
	codeLabel: "Código",
	linkLabel: "Enlace",
};
