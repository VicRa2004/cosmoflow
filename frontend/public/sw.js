// Service worker mínimo: hace la web instalable y muestra una página propia sin conexión.
// No cachea la app (los assets de Vite llevan hash y los datos deben ir frescos).
const CACHE = "cosmoflow-offline-v1";

self.addEventListener("install", (evento) => {
	evento.waitUntil(
		caches.open(CACHE).then((cache) => cache.add("/offline.html")),
	);
	self.skipWaiting();
});

self.addEventListener("activate", (evento) => {
	evento.waitUntil(
		caches
			.keys()
			.then((claves) =>
				Promise.all(
					claves.filter((c) => c !== CACHE).map((c) => caches.delete(c)),
				),
			)
			.then(() => self.clients.claim()),
	);
});

self.addEventListener("fetch", (evento) => {
	if (evento.request.mode !== "navigate") return;
	evento.respondWith(
		fetch(evento.request).catch(() => caches.match("/offline.html")),
	);
});
