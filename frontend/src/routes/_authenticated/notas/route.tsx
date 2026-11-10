import { createFileRoute } from "@tanstack/react-router";
import { contextoNotaSearch } from "@/modules/notas/schemas/notaSchemas";

export const Route = createFileRoute("/_authenticated/notas")({
	validateSearch: contextoNotaSearch,
});
