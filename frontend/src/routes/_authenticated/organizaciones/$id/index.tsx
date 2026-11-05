import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/organizaciones/$id/")({
	beforeLoad: ({ params }) => {
		throw redirect({
			to: "/organizaciones/$id/proyectos",
			params,
			replace: true,
		});
	},
});
