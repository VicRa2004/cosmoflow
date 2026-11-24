import { Download, Trash2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/core/components/ui/Button";
import {
	Card,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/core/components/ui/Card";
import { Dialog } from "@/core/components/ui/Dialog";
import { Input } from "@/core/components/ui/Input";
import {
	useEliminarCuentaMutation,
	useExportarDatosMutation,
} from "../hooks/useCuentaMutation";

/** Exportar mis datos (ZIP) y eliminar la cuenta con confirmación por contraseña. */
export function DatosCuentaCard() {
	const exportar = useExportarDatosMutation();
	const eliminar = useEliminarCuentaMutation();
	const [abierto, setAbierto] = useState(false);
	const [password, setPassword] = useState("");

	const cerrar = () => {
		setPassword("");
		setAbierto(false);
	};

	return (
		<Card className="space-y-4">
			<CardHeader className="pb-0">
				<CardTitle className="text-lg">Tus datos</CardTitle>
			</CardHeader>

			<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
				<CardDescription>
					Descarga un ZIP con tus notas en Markdown y tus tareas en JSON y CSV.
				</CardDescription>
				<Button
					variant="outline"
					size="sm"
					onClick={() => exportar.mutate()}
					isLoading={exportar.isPending}
				>
					<Download className="h-4 w-4" />
					Exportar mis datos
				</Button>
			</div>

			<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
				<CardDescription>
					Borra tu cuenta y tus tareas y notas personales. No se puede deshacer.
				</CardDescription>
				<Button
					variant="dangerGhost"
					size="sm"
					onClick={() => setAbierto(true)}
				>
					<Trash2 className="h-4 w-4" />
					Eliminar cuenta
				</Button>
			</div>

			<Dialog
				abierto={abierto}
				onCerrar={cerrar}
				titulo="Eliminar tu cuenta"
				descripcion="Se borrarán tus tareas, notas, carpetas, tags y plantillas personales, y saldrás de tus organizaciones. Lo que creaste en ellas se queda allí como «Usuario eliminado». Exporta antes tus datos si quieres conservarlos."
			>
				<form
					className="space-y-4"
					onSubmit={(evento) => {
						evento.preventDefault();
						eliminar.mutate(password);
					}}
				>
					<Input
						label="Contraseña"
						type="password"
						autoComplete="current-password"
						value={password}
						onChange={(e) => setPassword(e.target.value)}
						required
					/>
					<p className="text-xs text-tinta-tenue">
						¿Entras con Google? Crea antes una contraseña con «¿Olvidaste tu
						contraseña?» en la pantalla de acceso.
					</p>
					<div className="flex justify-end gap-2">
						<Button variant="ghost" onClick={cerrar}>
							Cancelar
						</Button>
						<Button
							type="submit"
							variant="danger"
							isLoading={eliminar.isPending}
							disabled={!password}
						>
							Eliminar definitivamente
						</Button>
					</div>
				</form>
			</Dialog>
		</Card>
	);
}
