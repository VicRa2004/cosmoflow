import { createFileRoute } from "@tanstack/react-router";
import { FileText } from "lucide-react";
import { EmptyState } from "@/core/components/ui/EmptyState";

export const Route = createFileRoute("/_authenticated/notas/")({
	component: function SinNotaAbierta() {
		return (
			<EmptyState
				icono={FileText}
				titulo="Ninguna nota abierta"
				descripcion="Elige una en el explorador o crea una nueva."
			/>
		);
	},
});
