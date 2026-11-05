import { Lock } from "lucide-react";
import { EmptyState } from "@/core/components/ui/EmptyState";

/** Para quien llega por URL a una sección que no le aparece en las pestañas. */
export function SinAccesoSeccion() {
	return <EmptyState icono={Lock} titulo="No tienes acceso a esta sección" />;
}
