import { describe, expect, it } from "bun:test";
import { resolverDestino } from "./destinoConexion";

describe("resolverDestino", () => {
	it.each([
		["https://claude.ai/api/mcp/auth_callback", "claude.ai", false],
		["https://claude.com/api/mcp/auth_callback", "claude.com", false],
		["http://localhost:3118/callback", "localhost", true],
		["http://127.0.0.1:51000/callback", "127.0.0.1", true],
	])("debería permitir %s", (uri, host, esLocal) => {
		expect(resolverDestino(uri)).toMatchObject({ host, esLocal });
	});

	it.each([
		"https://evil.com/api/mcp/auth_callback",
		"https://claude.ai/otra",
		"https://claude.ai.evil.com/api/mcp/auth_callback",
		"http://claude.ai/api/mcp/auth_callback",
		"https://localhost/callback",
		"http://localhost.evil.com/callback",
		"http://localhost@evil.com/callback",
		"http://user:x@localhost/callback",
		"http://localhost/callback#x",
		"javascript:alert(1)",
		"no es una url",
		"",
	])("debería rechazar %s", (uri) => {
		expect(resolverDestino(uri)).toBeNull();
	});
});
