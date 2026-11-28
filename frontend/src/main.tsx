import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider, createRouter } from "@tanstack/react-router";
import { QueryClientProvider } from "@tanstack/react-query";
import { ErrorBoundary } from "@/core/components/ErrorBoundary";
import { queryClient } from "@/core/router";
import {
	DefaultErrorComponent,
	DefaultNotFoundComponent,
} from "@/core/router/RouteFallbacks";
import { routeTree } from "./routeTree.gen";
import "@fontsource-variable/inter";
import "./index.css";
import { iniciarMonitoreo } from "@/core/monitoreo";
import { aplicarPreferenciasGuardadas } from "@/modules/configuracion/aplicarPreferencias";

iniciarMonitoreo();
aplicarPreferenciasGuardadas();

// PWA: instalable y con página propia sin conexión (public/sw.js). Solo en producción
// para que el SW no interfiera con el HMR de Vite.
if (import.meta.env.PROD && "serviceWorker" in navigator) {
	navigator.serviceWorker.register("/sw.js").catch(() => {});
}

const router = createRouter({
	routeTree,
	context: {
		queryClient,
	},
	defaultPreload: "intent",
	defaultErrorComponent: DefaultErrorComponent,
	defaultNotFoundComponent: DefaultNotFoundComponent,
});

declare module "@tanstack/react-router" {
	interface Register {
		router: typeof router;
	}
}

const rootElement = document.getElementById("root");
if (rootElement && !rootElement.innerHTML) {
	const root = createRoot(rootElement);
	root.render(
		<StrictMode>
			<ErrorBoundary>
				<QueryClientProvider client={queryClient}>
					<RouterProvider router={router} />
				</QueryClientProvider>
			</ErrorBoundary>
		</StrictMode>,
	);
}
