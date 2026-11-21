import { Check, RotateCcw, Trash2, X } from "lucide-react";
import { useState } from "react";
import { usePermisos } from "@/core/auth/usePermisos";
import { Button } from "@/core/components/ui/Button";
import { ConfirmDialog } from "@/core/components/ui/ConfirmDialog";
import { Select } from "@/core/components/ui/Select";
import type { EstadoTarea, PrioridadTarea } from "../api/tareasApi";
import {
	useAccionLoteTareasMutation,
	useEliminarLoteTareasMutation,
} from "../hooks/useTareasMutation";
import { ETIQUETAS_ESTADO, ETIQUETAS_PRIORIDAD } from "../schemas/tareaSchemas";

interface TagOpcion {
	id: number;
	nombre: string;
}

interface BarraAccionesLoteProps {
	seleccionadas: number[];
	tags: TagOpcion[];
	onLimpiar: () => void;
}

/** Barra contextual para operar en lote sobre las tareas seleccionadas en la tabla. */
export function BarraAccionesLote({
	seleccionadas,
	tags,
	onLimpiar,
}: BarraAccionesLoteProps) {
	const { puede } = usePermisos();
	const accionLote = useAccionLoteTareasMutation();
	const eliminarLote = useEliminarLoteTareasMutation();
	const [confirmarEliminar, setConfirmarEliminar] = useState(false);

	if (seleccionadas.length === 0) return null;

	const ocupada = accionLote.isPending || eliminarLote.isPending;
	const puedeActualizar = puede("tareas:actualizar");
	const puedeEliminar = puede("tareas:eliminar");

	const ejecutar = (datos: Parameters<typeof accionLote.mutate>[0]) => {
		accionLote.mutate(datos, { onSuccess: onLimpiar });
	};

	return (
		<>
			<section
				aria-label="Acciones en lote"
				className="flex flex-wrap items-center gap-2 rounded-lg border border-indigo-700/60 bg-indigo-950/30 px-3 py-2"
			>
				<span className="text-sm font-medium text-tinta">
					{seleccionadas.length}{" "}
					{seleccionadas.length === 1 ? "seleccionada" : "seleccionadas"}
				</span>
				<Button
					variant="ghost"
					size="sm"
					onClick={onLimpiar}
					disabled={ocupada}
					aria-label="Limpiar selección"
				>
					<X className="h-4 w-4" />
					Limpiar
				</Button>

				<div className="ml-auto flex flex-wrap items-center gap-2">
					{puedeActualizar && (
						<>
							<Button
								variant="outline"
								size="sm"
								disabled={ocupada}
								onClick={() =>
									ejecutar({
										ids: seleccionadas,
										accion: "estado",
										estado: "completada",
									})
								}
							>
								<Check className="h-4 w-4" />
								Completar
							</Button>
							<Button
								variant="outline"
								size="sm"
								disabled={ocupada}
								onClick={() =>
									ejecutar({
										ids: seleccionadas,
										accion: "estado",
										estado: "pendiente",
									})
								}
							>
								<RotateCcw className="h-4 w-4" />
								Reabrir
							</Button>

							<div className="w-36">
								<Select
									aria-label="Cambiar estado en lote"
									value=""
									disabled={ocupada}
									onChange={(e) => {
										const valor = e.target.value as EstadoTarea | "";
										if (!valor) return;
										ejecutar({
											ids: seleccionadas,
											accion: "estado",
											estado: valor,
										});
									}}
								>
									<option value="">Estado...</option>
									{Object.entries(ETIQUETAS_ESTADO).map(([valor, texto]) => (
										<option key={valor} value={valor}>
											{texto}
										</option>
									))}
								</Select>
							</div>

							<div className="w-36">
								<Select
									aria-label="Cambiar prioridad en lote"
									value=""
									disabled={ocupada}
									onChange={(e) => {
										const valor = e.target.value as PrioridadTarea | "";
										if (!valor) return;
										ejecutar({
											ids: seleccionadas,
											accion: "prioridad",
											prioridad: valor,
										});
									}}
								>
									<option value="">Prioridad...</option>
									{Object.entries(ETIQUETAS_PRIORIDAD).map(([valor, texto]) => (
										<option key={valor} value={valor}>
											{texto}
										</option>
									))}
								</Select>
							</div>

							{tags.length > 0 && (
								<>
									<div className="w-36">
										<Select
											aria-label="Asignar tag en lote"
											value=""
											disabled={ocupada}
											onChange={(e) => {
												const valor = Number(e.target.value);
												if (!valor) return;
												ejecutar({
													ids: seleccionadas,
													accion: "agregar_tag",
													tagId: valor,
												});
											}}
										>
											<option value="">+ Tag...</option>
											{tags.map((tag) => (
												<option key={tag.id} value={tag.id}>
													{tag.nombre}
												</option>
											))}
										</Select>
									</div>

									<div className="w-36">
										<Select
											aria-label="Quitar tag en lote"
											value=""
											disabled={ocupada}
											onChange={(e) => {
												const valor = Number(e.target.value);
												if (!valor) return;
												ejecutar({
													ids: seleccionadas,
													accion: "quitar_tag",
													tagId: valor,
												});
											}}
										>
											<option value="">- Tag...</option>
											{tags.map((tag) => (
												<option key={tag.id} value={tag.id}>
													{tag.nombre}
												</option>
											))}
										</Select>
									</div>
								</>
							)}
						</>
					)}

					{puedeEliminar && (
						<Button
							variant="dangerGhost"
							size="sm"
							disabled={ocupada}
							onClick={() => setConfirmarEliminar(true)}
						>
							<Trash2 className="h-4 w-4" />
							Mover a papelera
						</Button>
					)}
				</div>
			</section>

			<ConfirmDialog
				abierto={confirmarEliminar}
				titulo={`¿Mover ${seleccionadas.length} ${seleccionadas.length === 1 ? "tarea" : "tareas"} a la papelera?`}
				mensaje="Irán a la papelera, donde podrás restaurarlas durante 30 días."
				textoConfirmar="Mover a papelera"
				peligroso
				isLoading={eliminarLote.isPending}
				onCancelar={() => setConfirmarEliminar(false)}
				onConfirmar={() =>
					eliminarLote.mutate(seleccionadas, {
						onSuccess: () => {
							setConfirmarEliminar(false);
							onLimpiar();
						},
					})
				}
			/>
		</>
	);
}
