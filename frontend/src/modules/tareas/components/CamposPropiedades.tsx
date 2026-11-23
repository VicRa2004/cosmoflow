import { Link2, Repeat } from "lucide-react";
import { Combobox } from "@/core/components/ui/Combobox";
import { cn } from "@/core/utils/cn";
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
import { diaLocal } from "../utils/calendario";
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

/** Días de los atajos de fecha; «próxima semana» es el lunes que viene. */
export function diasAtajo(hoy: Date) {
	const en = (dias: number) =>
		diaLocal(new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() + dias));
	return {
		Hoy: en(0),
		Mañana: en(1),
		"Próx. semana": en((8 - hoy.getDay()) % 7 || 7),
	};
}

/** Botones bajo un campo de fecha; `""` = sin fecha. */
export function AtajosFecha({ valor, onChange }: CampoProps<string>) {
	const atajos = Object.entries(diasAtajo(new Date()));
	const boton =
		"cursor-pointer rounded px-1.5 py-0.5 text-xs text-tinta-tenue hover:bg-elevada hover:text-tinta";
	return (
		<div className="flex flex-wrap gap-1">
			{atajos.map(([etiqueta, dia]) => (
				<button
					key={etiqueta}
					type="button"
					aria-pressed={valor === dia}
					onClick={() => onChange(dia)}
					className={cn(boton, valor === dia && "bg-elevada text-tinta")}
				>
					{etiqueta}
				</button>
			))}
			{valor && (
				<button type="button" onClick={() => onChange("")} className={boton}>
					Sin fecha
				</button>
			)}
		</div>
	);
}
