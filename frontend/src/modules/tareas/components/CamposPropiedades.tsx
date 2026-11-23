import { Link2, Repeat } from "lucide-react";
import { Combobox } from "@/core/components/ui/Combobox";
import type {
	EstadoTarea,
	PrioridadTarea,
	RecurrenciaTarea,
	TareaDto,
} from "../api/tareasApi";
import {
	ETIQUETAS_ESTADO,
	ETIQUETAS_PRIORIDAD,
	ETIQUETAS_RECURRENCIA,
	estados,
	prioridades,
	recurrencias,
} from "../schemas/tareaSchemas";
import { IconoEstado, IconoPrioridad } from "./celdas";

interface CampoProps<T> {
	valor: T;
	onChange: (valor: T) => void;
}

const iconoTenue = "size-4 shrink-0 text-tinta-tenue";

export const CampoEstado = ({ valor, onChange }: CampoProps<EstadoTarea>) => (
	<Combobox
		label="Estado"
		opciones={estados.map((estado) => ({
			id: estado,
			etiqueta: ETIQUETAS_ESTADO[estado],
			icono: <IconoEstado estado={estado} />,
		}))}
		valor={valor}
		onChange={onChange}
	>
		<IconoEstado estado={valor} />
		{ETIQUETAS_ESTADO[valor]}
	</Combobox>
);

export const CampoPrioridad = ({
	valor,
	onChange,
}: CampoProps<PrioridadTarea>) => (
	<Combobox
		label="Prioridad"
		opciones={prioridades.map((prioridad) => ({
			id: prioridad,
			etiqueta: ETIQUETAS_PRIORIDAD[prioridad],
			icono: <IconoPrioridad prioridad={prioridad} />,
		}))}
		valor={valor}
		onChange={onChange}
	>
		<IconoPrioridad prioridad={valor} />
		{ETIQUETAS_PRIORIDAD[valor]}
	</Combobox>
);

/** `""` = no depende de ninguna. */
export function CampoDependeDe({
	valor,
	onChange,
	candidatas,
}: CampoProps<string> & { candidatas: TareaDto[] }) {
	const elegida = candidatas.find((t) => String(t.id) === valor);
	return (
		<Combobox
			label="Depende de"
			opciones={[
				{ id: "", etiqueta: "Ninguna" },
				...candidatas.map((t) => ({ id: String(t.id), etiqueta: t.titulo })),
			]}
			valor={valor}
			onChange={onChange}
		>
			<Link2 aria-hidden className={iconoTenue} />
			<span className="truncate">{elegida?.titulo ?? "Ninguna"}</span>
		</Combobox>
	);
}

/** `""` = no se repite. */
export const CampoRecurrencia = ({
	valor,
	onChange,
}: CampoProps<"" | RecurrenciaTarea>) => (
	<Combobox
		label="Repetición"
		opciones={[
			{ id: "" as const, etiqueta: "No se repite" },
			...recurrencias.map((r) => ({
				id: r,
				etiqueta: ETIQUETAS_RECURRENCIA[r],
			})),
		]}
		valor={valor}
		onChange={onChange}
	>
		<Repeat aria-hidden className={iconoTenue} />
		{valor ? ETIQUETAS_RECURRENCIA[valor] : "No se repite"}
	</Combobox>
);
