import { Checkbox } from "@/core/components/ui/Checkbox";

/** Primer error de un `form.Field` sin campo cableado (issue de Zod o texto). */
export const primerError = (errores: unknown[]) => {
	const error = errores[0];
	if (typeof error === "string") return error;
	if (error && typeof error === "object" && "message" in error) {
		return String(error.message);
	}
	return undefined;
};

interface CasillasIdsProps {
	leyenda: string;
	opciones: { id: number; etiqueta: string }[];
	valor: number[];
	onChange: (valor: number[]) => void;
	vacio?: string;
	error?: string;
}

/** Selección múltiple de ids con casillas nativas (miembros, tags, delegados). */
export function CasillasIds({
	leyenda,
	opciones,
	valor,
	onChange,
	vacio = "No hay opciones.",
	error,
}: CasillasIdsProps) {
	return (
		<fieldset className="space-y-2">
			<legend className="mb-1 text-[13px] font-medium text-tinta-suave">
				{leyenda}
			</legend>
			{opciones.length === 0 && (
				<p className="text-xs text-tinta-tenue">{vacio}</p>
			)}
			<div className="grid max-h-48 gap-2 overflow-y-auto sm:grid-cols-2">
				{opciones.map(({ id, etiqueta }) => (
					<Checkbox
						key={id}
						label={etiqueta}
						checked={valor.includes(id)}
						onChange={(e) =>
							onChange(
								e.target.checked
									? [...valor, id]
									: valor.filter((v) => v !== id),
							)
						}
					/>
				))}
			</div>
			{error && (
				<p role="alert" className="text-xs text-rose-400">
					{error}
				</p>
			)}
		</fieldset>
	);
}
