import { createFileRoute } from "@tanstack/react-router";
import { EncabezadoPagina } from "@/core/components/ui/EncabezadoPagina";
import { PlantillasCard } from "@/modules/plantillas/components/PlantillasCard";

export const Route = createFileRoute("/_authenticated/plantillas")({
	component: function Plantillas() {
		return (
			<div className="space-y-6">
				<EncabezadoPagina
					titulo="Plantillas"
					descripcion="Tus plantillas de tareas. Las de cada organización están en su pestaña «Plantillas»."
				/>
				<PlantillasCard />
			</div>
		);
	},
});
