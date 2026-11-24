import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { type RenderOptions, render } from "@testing-library/react";
import type { ReactElement, ReactNode } from "react";

export function crearQueryClientTest() {
	return new QueryClient({
		defaultOptions: {
			queries: { retry: false },
			mutations: { retry: false },
		},
	});
}

export function crearWrapperQuery(queryClient = crearQueryClientTest()) {
	return function WrapperQuery({ children }: { children: ReactNode }) {
		return (
			<QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
		);
	};
}

export function renderConQuery(
	ui: ReactElement,
	queryClient = crearQueryClientTest(),
	opciones?: Omit<RenderOptions, "wrapper">,
) {
	return {
		queryClient,
		...render(ui, { wrapper: crearWrapperQuery(queryClient), ...opciones }),
	};
}
