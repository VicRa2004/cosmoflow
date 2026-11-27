import { createFileRoute, redirect } from "@tanstack/react-router";

/** Enlaces antiguos: la nota ya se abre en edición en `/notas/$id`. */
export const Route = createFileRoute("/_authenticated/notas/$id_/editar")({
	beforeLoad: ({ params }) => {
		throw redirect({ to: "/notas/$id", params, replace: true });
	},
});
