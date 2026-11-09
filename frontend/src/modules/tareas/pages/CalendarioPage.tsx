import { Link } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight, Users } from "lucide-react";
import { useState } from "react";
import { Button } from "@/core/components/ui/Button";
import { EncabezadoPagina } from "@/core/components/ui/EncabezadoPagina";
import { PuntoColor } from "@/core/components/ui/PuntoColor";
import { Spinner } from "@/core/components/ui/Spinner";
import { getErrorMessage } from "@/core/api/client";
import { cn } from "@/core/utils/cn";
import type { TareaDto } from "../api/tareasApi";
import { esCompartida } from "../components/celdas";
import { MenuNuevo } from "../components/MenuNuevo";
import { useCalendarioQuery } from "../hooks/useTareasQuery";
import { diaLocal, diasDelMes } from "../utils/calendario";

const DIAS_SEMANA = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

/** Cada tarea va en su vencimiento o, sin él, en su inicio (como en la API). */
const diaDe = (tarea: TareaDto) => tarea.fechaVencimiento ?? tarea.fechaInicio;

/** Mes con las tareas personales y las de las organizaciones del usuario. */
export function CalendarioPage() {
	const [{ anio, mes }, setMes] = useState(() => {
		const hoy = new Date();
		return { anio: hoy.getFullYear(), mes: hoy.getMonth() };
	});
	// `Date` normaliza el desborde: mes -1 es diciembre del año anterior.
	const mover = (meses: number) => {
		const fecha = new Date(anio, mes + meses);
		setMes({ anio: fecha.getFullYear(), mes: fecha.getMonth() });
	};
	const dias = diasDelMes(anio, mes);
	const hoy = diaLocal(new Date());
	const {
		data = [],
		isFetching,
		error,
	} = useCalendarioQuery(dias[0], dias[dias.length - 1]);
	const porDia = new Map<string, TareaDto[]>();
	for (const tarea of data) {
		const dia = diaDe(tarea);
		if (dia) porDia.set(dia, [...(porDia.get(dia) ?? []), tarea]);
	}
	const titulo = new Date(anio, mes).toLocaleDateString("es-ES", {
		month: "long",
		year: "numeric",
	});

	return (
		<div className="space-y-6">
			<EncabezadoPagina
				titulo={<span className="capitalize">{titulo}</span>}
				descripcion="Tus tareas y las de tus organizaciones, por vencimiento."
			>
				{isFetching && <Spinner size="sm" />}
				<div className="flex items-center gap-1">
					<Button
						variant="outline"
						size="sm"
						aria-label="Mes anterior"
						onClick={() => mover(-1)}
					>
						<ChevronLeft className="h-4 w-4" />
					</Button>
					<Button
						variant="outline"
						size="sm"
						onClick={() => {
							const ahora = new Date();
							setMes({ anio: ahora.getFullYear(), mes: ahora.getMonth() });
						}}
					>
						Hoy
					</Button>
					<Button
						variant="outline"
						size="sm"
						aria-label="Mes siguiente"
						onClick={() => mover(1)}
					>
						<ChevronRight className="h-4 w-4" />
					</Button>
				</div>
				<MenuNuevo soloTareas />
			</EncabezadoPagina>

			{error ? (
				<p role="alert" className="text-sm text-rose-400">
					{getErrorMessage(error)}
				</p>
			) : (
				// shortcut: en móvil la cuadrícula se desplaza en horizontal, pasar a vista de agenda si se usa mucho ahí
				<div className="overflow-x-auto rounded-lg border border-borde">
					<div className="grid min-w-[44rem] grid-cols-7 bg-superficie">
						{DIAS_SEMANA.map((nombre) => (
							<div
								key={nombre}
								className="border-b border-borde px-2 py-1.5 text-xs font-medium text-tinta-tenue"
							>
								{nombre}
							</div>
						))}
						{dias.map((dia) => {
							const fecha = new Date(`${dia}T00:00`);
							const tareas = porDia.get(dia) ?? [];
							return (
								<section
									key={dia}
									aria-label={fecha.toLocaleDateString("es-ES", {
										weekday: "long",
										day: "numeric",
										month: "long",
									})}
									className={cn(
										"min-h-24 min-w-0 space-y-1 border-r border-b border-borde p-1.5 [&:nth-child(7n)]:border-r-0",
										fecha.getMonth() !== mes && "bg-fondo",
									)}
								>
									<span
										className={cn(
											"inline-flex h-6 min-w-6 items-center justify-center rounded-full px-1 text-xs text-tinta-suave",
											fecha.getMonth() !== mes && "text-tinta-tenue",
											dia === hoy && "bg-indigo-600 font-semibold text-white",
										)}
									>
										{fecha.getDate()}
									</span>
									{tareas.map((tarea) => (
										<Link
											key={tarea.id}
											to="/tareas/$id"
											params={{ id: String(tarea.id) }}
											title={tarea.titulo}
											className={cn(
												"flex items-center gap-1 rounded bg-elevada px-1.5 py-0.5 text-xs text-tinta hover:bg-borde",
												(tarea.estado === "completada" ||
													tarea.estado === "cancelada") &&
													"text-tinta-tenue line-through",
												tarea.estado !== "completada" &&
													tarea.estado !== "cancelada" &&
													dia < hoy &&
													"text-rose-400",
											)}
										>
											<PuntoColor color={tarea.color} className="h-2 w-2" />
											<span className="truncate">{tarea.titulo}</span>
											{esCompartida(tarea) && (
												<Users
													aria-label="Compartida"
													className="ml-auto h-3 w-3 shrink-0 text-tinta-tenue"
												/>
											)}
										</Link>
									))}
								</section>
							);
						})}
					</div>
				</div>
			)}
		</div>
	);
}
