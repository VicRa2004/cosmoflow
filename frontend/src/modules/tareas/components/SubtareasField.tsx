import { Plus, Trash2 } from "lucide-react";
import { useRef, useState } from "react";
import { Button } from "@/core/components/ui/Button";
import { Input } from "@/core/components/ui/Input";
import { cn } from "@/core/utils/cn";

export interface SubtareaEditable {
	titulo: string;
	completada: boolean;
}

interface SubtareasFieldProps {
	valor: SubtareaEditable[];
	onChange: (subtareas: SubtareaEditable[]) => void;
}

/** Lista editable de subtareas en el formulario de tarea (#57). */
export function SubtareasField({ valor, onChange }: SubtareasFieldProps) {
	const [nueva, setNueva] = useState("");
	const siguienteClave = useRef(1);
	const claves = useRef<number[]>([]);
	while (claves.current.length < valor.length) {
		claves.current.push(siguienteClave.current++);
	}
	if (claves.current.length > valor.length) {
		claves.current.length = valor.length;
	}
	const completadas = valor.filter((s) => s.completada).length;

	const agregar = () => {
		const titulo = nueva.trim();
		if (!titulo) return;
		claves.current.push(siguienteClave.current++);
		onChange([...valor, { titulo, completada: false }]);
		setNueva("");
	};

	const alternar = (indice: number) =>
		onChange(
			valor.map((sub, i) =>
				i === indice ? { ...sub, completada: !sub.completada } : sub,
			),
		);

	const cambiarTitulo = (indice: number, titulo: string) =>
		onChange(valor.map((sub, i) => (i === indice ? { ...sub, titulo } : sub)));

	const quitar = (indice: number) => {
		claves.current.splice(indice, 1);
		onChange(valor.filter((_, i) => i !== indice));
	};

	return (
		<div className="space-y-2">
			<div className="flex items-center justify-between">
				<span className="text-sm font-medium text-tinta-suave">Subtareas</span>
				{valor.length > 0 && (
					<span className="text-xs text-tinta-tenue">
						{completadas}/{valor.length} completadas
					</span>
				)}
			</div>
			{valor.length > 0 && (
				<ul className="space-y-1.5">
					{valor.map((sub, indice) => (
						<li
							key={claves.current[indice]}
							className="flex items-center gap-2"
						>
							<input
								type="checkbox"
								checked={sub.completada}
								onChange={() => alternar(indice)}
								aria-label={`Completar subtarea «${sub.titulo || indice + 1}»`}
								className="h-4 w-4 shrink-0 cursor-pointer rounded border border-borde-fuerte bg-superficie accent-indigo-600"
							/>
							<Input
								value={sub.titulo}
								onChange={(e) => cambiarTitulo(indice, e.target.value)}
								placeholder="Título de la subtarea"
								className={cn(
									"h-8 flex-1 text-sm",
									sub.completada && "text-tinta-tenue line-through",
								)}
							/>
							<Button
								type="button"
								variant="dangerGhost"
								size="sm"
								onClick={() => quitar(indice)}
								aria-label={`Quitar subtarea «${sub.titulo || indice + 1}»`}
							>
								<Trash2 className="h-4 w-4" />
							</Button>
						</li>
					))}
				</ul>
			)}
			<div className="flex items-center gap-2">
				<Input
					value={nueva}
					onChange={(e) => setNueva(e.target.value)}
					onKeyDown={(e) => {
						if (e.key === "Enter") {
							e.preventDefault();
							agregar();
						}
					}}
					placeholder="Añadir subtarea…"
					aria-label="Nueva subtarea"
					className="h-9 flex-1"
				/>
				<Button
					type="button"
					variant="secondary"
					size="sm"
					onClick={agregar}
					disabled={!nueva.trim()}
				>
					<Plus className="h-4 w-4" />
					Añadir
				</Button>
			</div>
		</div>
	);
}
