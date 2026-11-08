import { Input } from "@/core/components/ui/Input";

/** `YYYY-MM-DD` de los `<input type="date">`; vacío = sin límite. */
export interface RangosFecha {
	creadaDesde: string;
	creadaHasta: string;
	editadaDesde: string;
	editadaHasta: string;
}

export const sinRangos: RangosFecha = {
	creadaDesde: "",
	creadaHasta: "",
	editadaDesde: "",
	editadaHasta: "",
};

/** Días locales → instantes ISO: «desde» al empezar el día, «hasta» al acabarlo. */
export function rangosAParams(r: RangosFecha) {
	const inicio = (d: string) =>
		d ? new Date(`${d}T00:00:00`).toISOString() : undefined;
	const fin = (d: string) =>
		d ? new Date(`${d}T23:59:59.999`).toISOString() : undefined;
	return {
		creadaDesde: inicio(r.creadaDesde),
		creadaHasta: fin(r.creadaHasta),
		editadaDesde: inicio(r.editadaDesde),
		editadaHasta: fin(r.editadaHasta),
	};
}

const CAMPOS: { clave: keyof RangosFecha; etiqueta: string }[] = [
	{ clave: "creadaDesde", etiqueta: "Creada desde" },
	{ clave: "creadaHasta", etiqueta: "Creada hasta" },
	{ clave: "editadaDesde", etiqueta: "Editada desde" },
	{ clave: "editadaHasta", etiqueta: "Editada hasta" },
];

export function FiltrosFecha({
	valor,
	onChange,
}: {
	valor: RangosFecha;
	onChange: (valor: RangosFecha) => void;
}) {
	return (
		<div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
			{CAMPOS.map(({ clave, etiqueta }) => (
				<Input
					key={clave}
					type="date"
					label={etiqueta}
					value={valor[clave]}
					onChange={(e) => onChange({ ...valor, [clave]: e.target.value })}
				/>
			))}
		</div>
	);
}
