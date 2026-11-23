// Los e2e borran datos: solo contra DATABASE_URL_TEST, que pone `scripts/test-e2e.ts`.
// No vale mirar NODE_ENV: `bun test` siempre lo pone a "test".
if (
	!process.env.DATABASE_URL_TEST ||
	process.env.DATABASE_URL !== process.env.DATABASE_URL_TEST
) {
	throw new Error(
		"Los e2e solo se ejecutan con `pnpm test:e2e` (contra DATABASE_URL_TEST); se abortan para no vaciar la BD de desarrollo.",
	);
}
