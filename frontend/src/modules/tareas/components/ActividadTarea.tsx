import { Button } from "@/core/components/ui/Button";
import { Spinner } from "@/core/components/ui/Spinner";
import type { EntradaActividad } from "../api/comentariosApi";
import { useActividadQuery } from "../hooks/useComentarios";
import { ETIQUETAS_ESTADO, ETIQUETAS_PRIORIDAD } from "../schemas/tareaSchemas";

type Cambio = { anterior: string | null; nuevo: string | null };

const CAMPOS: Record<string, string> = {
	titulo: "el título",
	prioridad: "la prioridad",
	fechaInicio: "el inicio",
	fechaVencimiento: "el vencimiento",
};

const etiqueta = (mapa: Record<string, string>, valor: unknown): string =>
	typeof valor === "string" ? (mapa[valor] ?? valor) : "—";

const valorCampo = (campo: string, valor: string | null): string => {
	if (valor === null) return "—";
	if (campo === "prioridad") return etiqueta(ETIQUETAS_PRIORIDAD, valor);
	if (campo === "titulo") return `«${valor}»`;
	// `AAAA-MM-DD` sin hora: a mediodía local para que no cambie de día.
	return new Date(`${valor}T12:00:00`).toLocaleDateString();
};

/** Qué hizo, en una frase que sigue al nombre de quien lo hizo. */
function describir(
	{ evento, datos }: EntradaActividad,
	nombres: Record<string, string>,
): string {
	switch (evento) {
		case "tarea.creada":
			return "creó la tarea";
		case "tarea.actualizada":
			return `cambió ${Object.entries(
				(datos.cambios ?? {}) as Record<string, Cambio>,
			)
				.map(
					([campo, { anterior, nuevo }]) =>
						`${CAMPOS[campo] ?? campo} de ${valorCampo(campo, anterior)} a ${valorCampo(campo, nuevo)}`,
				)
				.join(", ")}`;
		case "tarea.estadoCambiado":
			return `cambió el estado de ${etiqueta(ETIQUETAS_ESTADO, datos.anterior)} a ${etiqueta(ETIQUETAS_ESTADO, datos.nuevo)}`;
		case "tarea.responsablesAsignados":
			return `asignó a ${((datos.usuarioIds ?? []) as number[])
				.map((id) => nombres[id] ?? "alguien")
				.join(", ")}`;
		case "tarea.movida":
			return datos.proyectoId
				? "la movió a un proyecto"
				: datos.equipoId
					? "la movió a un equipo"
					: "la movió a la organización";
		case "tarea.eliminada":
			return "la mandó a la papelera";
		case "tarea.restaurada":
			return "la restauró de la papelera";
		case "tarea.comentada":
			return "comentó";
	}
}

/** Historial de la tarea: lo último primero. */
export function ActividadTarea({ tareaId }: { tareaId: number }) {
	const { data, isLoading, hasNextPage, fetchNextPage, isFetchingNextPage } =
		useActividadQuery(tareaId);
	const paginas = data?.pages ?? [];
	const nombres = Object.assign({}, ...paginas.map((p) => p.nombres));
	const entradas = paginas.flatMap((p) => p.datos);

	return (
		<section aria-labelledby="actividad" className="space-y-3">
			<h2 id="actividad" className="text-lg font-semibold text-tinta">
				Actividad
			</h2>
			{isLoading ? (
				<Spinner />
			) : entradas.length === 0 ? (
				<p className="text-sm text-tinta-tenue">Sin actividad registrada.</p>
			) : (
				<ol className="space-y-2 border-l border-borde pl-4">
					{entradas.map((entrada) => (
						<li key={entrada.id} className="text-sm text-tinta-suave">
							<span className="font-medium text-tinta">
								{entrada.actorId === null
									? "Cosmoflow"
									: (nombres[entrada.actorId] ?? "Alguien")}
							</span>{" "}
							{describir(entrada, nombres)}
							<span className="text-tinta-tenue">
								{" "}
								· {new Date(entrada.ocurridoEn).toLocaleString()}
							</span>
						</li>
					))}
				</ol>
			)}
			{hasNextPage && (
				<Button
					variant="ghost"
					size="sm"
					isLoading={isFetchingNextPage}
					onClick={() => fetchNextPage()}
				>
					Ver más
				</Button>
			)}
		</section>
	);
}
